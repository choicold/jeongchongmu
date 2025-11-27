package com.jeongchongmu.settlement.service;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.JPA.ExpenseParticipant;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.settlement.dto.DirectSettlementEntry;
import com.jeongchongmu.settlement.dto.PercentSettlementEntry;
import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.entity.SettlementDetail;
import com.jeongchongmu.settlement.enums.SettlementStatus;
import com.jeongchongmu.settlement.repository.SettlementDetailRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.repository.VoteRepository;
import com.jeongchongmu.vote.repository.UserVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final SettlementDetailRepository settlementDetailRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final VoteRepository voteRepository;
    private final UserVoteRepository userVoteRepository;

    @Transactional
    public SettlementResponse createSettlement(SettlementCreateRequest request, User requester) {

        // 1. 지출 및 그룹 정보 조회
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지출 내역입니다."));

        // 이미 정산된 내역인지 확인
        if (settlementRepository.findByExpenseId(expense.getId()).isPresent()) {
            throw new IllegalStateException("이미 정산이 진행 중이거나 완료된 지출 내역입니다.");
        }

        Group group = expense.getGroup();
        long totalAmount = expense.getAmount();
        User payer = expense.getPayer();

        // 2. 정산 방식에 따른 참여자 ID 추출 및 검증
        Set<Long> participantIds = new HashSet<>();

        switch (request.getMethod()) {
            case N_BUN_1 -> {
                if (request.getParticipantUserIds() == null || request.getParticipantUserIds().isEmpty()) {
                    throw new IllegalArgumentException("N빵 정산 참여자가 없습니다.");
                }
                participantIds.addAll(request.getParticipantUserIds());
            }
            case DIRECT -> {
                if (request.getDirectEntries() == null || request.getDirectEntries().isEmpty()) {
                    throw new IllegalArgumentException("직접 정산 내역이 없습니다.");
                }
                long sum = request.getDirectEntries().stream()
                        .mapToLong(DirectSettlementEntry::getAmount)
                        .sum();
                if (sum != totalAmount) {
                    throw new IllegalArgumentException("입력된 금액의 합계(" + sum + ")가 지출 총액(" + totalAmount + ")과 일치하지 않습니다.");
                }
                request.getDirectEntries().forEach(entry -> participantIds.add(entry.getUserId()));
            }
            case PERCENT -> {
                if (request.getPercentEntries() == null || request.getPercentEntries().isEmpty()) {
                    throw new IllegalArgumentException("퍼센트 정산 내역이 없습니다.");
                }
                double ratioSum = request.getPercentEntries().stream()
                        .mapToDouble(PercentSettlementEntry::getRatio)
                        .sum();
                if (Math.abs(ratioSum - 100.0) > 0.01) { // 부동소수점 오차 고려
                    throw new IllegalArgumentException("비율의 합계가 100%가 아닙니다.");
                }
                request.getPercentEntries().forEach(entry -> participantIds.add(entry.getUserId()));
            }
            case ITEM -> {
                // ITEM 방식은 Vote 데이터 기반 - 참여자는 expense.getParticipants()에서 가져옴
            }
            default -> throw new IllegalArgumentException("지원하지 않는 정산 방식입니다.");
        }

        // 3. 유저 조회 및 그룹 멤버십 검증 (ITEM 방식 제외)
        Map<Long, User> validatedUserMap = new HashMap<>();

        if (!participantIds.isEmpty()) {
            List<User> users = userRepository.findAllById(participantIds);

            if (users.size() != participantIds.size()) {
                throw new IllegalArgumentException("요청된 참여자 중 존재하지 않는 유저가 포함되어 있습니다.");
            }

            for (User user : users) {
                if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                    throw new IllegalStateException("그룹 멤버가 아닌 유저가 정산에 포함되었습니다: " + user.getName());
                }
                validatedUserMap.put(user.getId(), user);
            }
        }

        // 4. 정산 생성 (DB 저장)
        Settlement newSettlement = Settlement.builder()
                .expense(expense)
                .method(request.getMethod())
                .status(SettlementStatus.PENDING)
                .build();
        settlementRepository.save(newSettlement);

        // 5. 계산 로직 분기
        List<SettlementDetail> details;
        switch (request.getMethod()) {
            case N_BUN_1 -> details = calculateDivide(newSettlement, totalAmount, payer, validatedUserMap);
            case DIRECT -> details = calculateDirect(newSettlement, payer, request.getDirectEntries(), validatedUserMap);
            case PERCENT -> details = calculatePercent(newSettlement, totalAmount, payer, request.getPercentEntries(), validatedUserMap);
            case ITEM -> details = calculateItem(newSettlement, payer, expense);
            default -> throw new IllegalArgumentException("지원하지 않는 정산 방식입니다.");
        }

        // 6. 상세 내역 저장
        settlementDetailRepository.saveAll(details);
        newSettlement.getDetails().addAll(details);

        return SettlementResponse.from(newSettlement, totalAmount);
    }

    // ================== 기존 계산 메서드들 ==================

    private List<SettlementDetail> calculateDivide(Settlement settlement, Long totalAmount, User payer, Map<Long, User> userMap) {
        List<User> participants = new ArrayList<>(userMap.values());
        int count = participants.size();
        long splitAmount = totalAmount / count;
        long remainder = totalAmount % count;
        List<SettlementDetail> details = new ArrayList<>();

        for (User participant : participants) {
            if (participant.getId().equals(payer.getId())) continue;
            long finalAmount = splitAmount;
            if (remainder > 0) {
                finalAmount += 1;
                remainder--;
            }
            details.add(SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(participant)
                    .creditor(payer)
                    .amount(finalAmount)
                    .build());
        }
        return details;
    }

    private List<SettlementDetail> calculateDirect(Settlement settlement, User payer, List<DirectSettlementEntry> entries, Map<Long, User> userMap) {
        List<SettlementDetail> details = new ArrayList<>();
        for (DirectSettlementEntry entry : entries) {
            User debtor = userMap.get(entry.getUserId());
            if (debtor.getId().equals(payer.getId())) continue;
            details.add(SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(debtor)
                    .creditor(payer)
                    .amount(entry.getAmount())
                    .build());
        }
        return details;
    }

    private List<SettlementDetail> calculatePercent(Settlement settlement, Long totalAmount, User payer, List<PercentSettlementEntry> entries, Map<Long, User> userMap) {
        List<SettlementDetail> details = new ArrayList<>();
        long currentTotal = 0;

        for (int i = 0; i < entries.size(); i++) {
            PercentSettlementEntry entry = entries.get(i);
            User debtor = userMap.get(entry.getUserId());
            long amount;

            if (i == entries.size() - 1) {
                amount = totalAmount - currentTotal;
            } else {
                amount = (long) (totalAmount * (entry.getRatio() / 100.0));
                currentTotal += amount;
            }

            if (debtor.getId().equals(payer.getId())) continue;
            details.add(SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(debtor)
                    .creditor(payer)
                    .amount(amount)
                    .build());
        }
        return details;
    }

    /**
     * ITEM 방식 정산 계산 (개선됨)
     *
     * 규칙:
     * - 투표한 사람 → 자신이 선택한 항목에 대해서만 1/n
     * - 투표 안 한 사람 → 모든 항목에 대해서 1/n (패널티)
     */
    private List<SettlementDetail> calculateItem(Settlement settlement, User payer, Expense expense) {
        // 1. 투표 조회
        Vote vote = voteRepository.findByExpense(expense)
                .orElseThrow(() -> new IllegalArgumentException("투표 내역이 없습니다. 먼저 투표를 생성해주세요."));

        // 2. 투표가 마감되었는지 확인
        if (!vote.isClosed()) {
            throw new IllegalStateException("투표가 아직 마감되지 않았습니다. 마감 후 정산해주세요.");
        }

        // 3. 지출 참여자 목록 조회
        Set<Long> allParticipantIds = expense.getParticipants().stream()
                .map(p -> p.getUser().getId())
                .collect(Collectors.toSet());

        // 4. 투표한 사용자 ID 목록 조회
        Set<Long> votedUserIds = userVoteRepository.findVotedUserIdsByVote(vote);

        // 5. 미투표자 ID 목록 = 전체 참여자 - 투표한 사람
        Set<Long> nonVotedUserIds = new HashSet<>(allParticipantIds);
        nonVotedUserIds.removeAll(votedUserIds);

        // 6. 각 사용자별 부담 금액 계산
        Map<Long, Long> userAmountMap = new HashMap<>();

        for (VoteOption option : vote.getOptions()) {
            List<UserVote> votes = userVoteRepository.findByVoteOption(option);
            long itemPrice = option.getExpenseItem().getPrice();
            int quantity = option.getExpenseItem().getQuantity();
            long totalItemPrice = itemPrice * quantity;

            // 이 항목을 선택한 사람들 + 미투표자들
            Set<Long> eaterIds = votes.stream()
                    .map(uv -> uv.getUser().getId())
                    .collect(Collectors.toSet());
            eaterIds.addAll(nonVotedUserIds);  // 미투표자는 모든 항목에 포함

            int eaterCount = eaterIds.size();
            if (eaterCount == 0) continue;

            long splitPrice = totalItemPrice / eaterCount;
            long remainder = totalItemPrice % eaterCount;

            for (Long eaterId : eaterIds) {
                long amountToAdd = splitPrice;
                if (remainder > 0) {
                    amountToAdd += 1;
                    remainder--;
                }
                userAmountMap.merge(eaterId, amountToAdd, Long::sum);
            }
        }

        // 7. SettlementDetail 생성
        List<SettlementDetail> details = new ArrayList<>();

        if (!userAmountMap.isEmpty()) {
            Map<Long, User> userMap = userRepository.findAllById(userAmountMap.keySet())
                    .stream()
                    .collect(Collectors.toMap(User::getId, Function.identity()));

            for (Map.Entry<Long, Long> entry : userAmountMap.entrySet()) {
                Long debtorId = entry.getKey();
                Long amount = entry.getValue();

                // 결제자는 제외
                if (debtorId.equals(payer.getId())) continue;

                User debtor = userMap.get(debtorId);
                if (debtor == null) continue;

                details.add(SettlementDetail.builder()
                        .settlement(settlement)
                        .debtor(debtor)
                        .creditor(payer)
                        .amount(amount)
                        .build());
            }
        }

        return details;
    }
}