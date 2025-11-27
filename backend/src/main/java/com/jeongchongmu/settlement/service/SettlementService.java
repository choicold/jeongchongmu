package com.jeongchongmu.settlement.service;

import com.jeongchongmu.domain.expense.JPA.Expense;
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

        // [추가] 이미 정산된 내역인지 확인 (중복 생성 방지)
        // SettlementRepository에 findByExpenseId 혹은 findByExpense가 있어야 함
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

                // [추가] 직접 정산 시 총액 검증 (입력 합계 == 지출 총액)
                long sum = request.getDirectEntries().stream()
                        .mapToLong(DirectSettlementEntry::getAmount)
                        .sum();

                // 주의: 결제자(Payer) 본인의 부담금이 directEntries에 포함되지 않는 경우라면,
                // (총액 - 본인부담금) == 입력합계 인지 확인해야 합니다.
                // 현재 로직상 entries의 합이 전체 금액과 같아야 한다면 아래 로직 사용:
                if (sum != totalAmount) {
                    throw new IllegalArgumentException("입력된 금액의 합계(" + sum + ")가 지출 총액(" + totalAmount + ")과 일치하지 않습니다.");
                }

                request.getDirectEntries().forEach(entry -> participantIds.add(entry.getUserId()));
            }
            case PERCENT -> {
                if (request.getPercentEntries() == null || request.getPercentEntries().isEmpty()) {
                    throw new IllegalArgumentException("퍼센트 정산 내역이 없습니다.");
                }
                // 퍼센트 합계가 100인지 확인하는 로직도 추가 가능
                double ratioSum = request.getPercentEntries().stream()
                        .mapToDouble(PercentSettlementEntry::getRatio)
                        .sum();
                if (Math.abs(ratioSum - 100.0) > 0.01) { // 부동소수점 오차 고려
                    throw new IllegalArgumentException("비율의 합계가 100%가 아닙니다.");
                }

                request.getPercentEntries().forEach(entry -> participantIds.add(entry.getUserId()));
            }
            case ITEM -> {
                // ITEM 방식은 Vote 데이터 기반
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

    // ================== 계산 메서드 (기존 동일) ==================
    // calculateDivide, calculateDirect, calculatePercent, calculateItem 등은 기존 코드 유지
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
            details.add(SettlementDetail.builder().settlement(settlement).debtor(participant).creditor(payer).amount(finalAmount).build());
        }
        return details;
    }

    private List<SettlementDetail> calculateDirect(Settlement settlement, User payer, List<DirectSettlementEntry> entries, Map<Long, User> userMap) {
        List<SettlementDetail> details = new ArrayList<>();
        for (DirectSettlementEntry entry : entries) {
            User debtor = userMap.get(entry.getUserId());
            if (debtor.getId().equals(payer.getId())) continue;
            details.add(SettlementDetail.builder().settlement(settlement).debtor(debtor).creditor(payer).amount(entry.getAmount()).build());
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
            details.add(SettlementDetail.builder().settlement(settlement).debtor(debtor).creditor(payer).amount(amount).build());
        }
        return details;
    }

    private List<SettlementDetail> calculateItem(Settlement settlement, User payer, Expense expense) {
        Vote vote = voteRepository.findByExpense(expense).orElseThrow(() -> new IllegalArgumentException("투표 내역이 없습니다. 먼저 투표를 생성해주세요."));
        Map<Long, Long> userAmountMap = new HashMap<>();
        for (VoteOption option : vote.getOptions()) {
            List<UserVote> votes = userVoteRepository.findByVoteOption(option);
            int eaterCount = votes.size();
            if (eaterCount == 0) continue;
            long price = option.getExpenseItem().getPrice();
            long splitPrice = price / eaterCount;
            long remainder = price % eaterCount;
            for (UserVote uv : votes) {
                User eater = uv.getUser();
                if (eater.getId().equals(payer.getId())) continue;
                long amountToAdd = splitPrice;
                if (remainder > 0) {
                    amountToAdd += 1;
                    remainder--;
                }
                userAmountMap.merge(eater.getId(), amountToAdd, Long::sum);
            }
        }
        List<SettlementDetail> details = new ArrayList<>();
        if (!userAmountMap.isEmpty()) {
            Map<Long, User> itemUserMap = userRepository.findAllById(userAmountMap.keySet()).stream().collect(Collectors.toMap(User::getId, Function.identity()));
            for (Map.Entry<Long, Long> entry : userAmountMap.entrySet()) {
                User debtor = itemUserMap.get(entry.getKey());
                if (debtor == null) continue;
                details.add(SettlementDetail.builder().settlement(settlement).debtor(debtor).creditor(payer).amount(entry.getValue()).build());
            }
        }
        return details;
    }
}