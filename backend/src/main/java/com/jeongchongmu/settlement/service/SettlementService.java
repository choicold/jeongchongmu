package com.jeongchongmu.settlement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import com.jeongchongmu.settlement.dto.DirectSettlementEntry;
import com.jeongchongmu.settlement.dto.PercentSettlementEntry;
import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.entity.SettlementDetail;
import com.jeongchongmu.settlement.enums.SettlementStatus;
import com.jeongchongmu.settlement.repository.SettlementDetailRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;

import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.repository.VoteRepository;
import com.jeongchongmu.vote.repository.UserVoteRepository;

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
    public SettlementResponse createSettlement(SettlementCreateRequest request) {

        // 1. 지출 조회
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지출 내역입니다."));

        long totalAmount = expense.getAmount();
        User payer = expense.getPayer();
        Group group = expense.getGroup();

        // 2. 참여자 검증
        List<User> participants = userRepository.findAllById(request.getParticipantUserIds());
        if (participants.size() != request.getParticipantUserIds().size()) {
            throw new IllegalArgumentException("참여 멤버 중 존재하지 않는 유저가 있습니다.");
        }
        for (User user : participants) {
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                throw new IllegalStateException("그룹 멤버가 아닌 유저가 정산에 포함되었습니다: " + user.getName());
            }
        }

        // 3. 정산 생성
        Settlement newSettlement = Settlement.builder()
                .expense(expense)
                .method(request.getMethod())
                .status(SettlementStatus.PENDING)
                .build();
        settlementRepository.save(newSettlement);

        // 4. 계산 로직 분기
        switch (request.getMethod()) {
            case N_BUN_1 -> calculateDivide(newSettlement, totalAmount, payer, participants);
            case DIRECT -> calculateDirect(newSettlement, payer, request.getDirectEntries());
            case PERCENT -> calculatePercent(newSettlement, totalAmount, payer, request.getPercentEntries());
            case ITEM -> calculateItem(newSettlement, payer, expense);
        }

        return SettlementResponse.from(newSettlement, totalAmount);
    }

    // N분의 1 계산
    private void calculateDivide(Settlement settlement, Long totalAmount, User payer, List<User> participants) {
        int participantCount = participants.size();
        if (participantCount == 0) throw new IllegalArgumentException("참여자가 없습니다.");

        // 정수 나눗셈 (나머지는 버려짐, 필요시 나머지 처리 로직 추가 가능)
        Long amountPerPerson = totalAmount / participantCount;

        List<SettlementDetail> details = new ArrayList<>();
        for (User participant : participants) {
            if (participant.getId().equals(payer.getId())) continue;

            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(participant)
                    .creditor(payer)
                    .amount(amountPerPerson) // Long 타입
                    .build();
            details.add(detail);
        }
        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }

    // 직접 입력 계산
    private void calculateDirect(Settlement settlement, User payer, List<DirectSettlementEntry> entries) {
        if (entries == null || entries.isEmpty()) throw new IllegalArgumentException("직접 정산 내역이 없습니다.");

        List<SettlementDetail> details = new ArrayList<>();
        for (DirectSettlementEntry entry : entries) {
            User debtor = userRepository.findById(entry.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("참여자를 찾을 수 없습니다."));
            if (debtor.getId().equals(payer.getId())) continue;

            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(debtor)
                    .creditor(payer)
                    .amount(entry.getAmount())
                    .build();
            details.add(detail);
        }
        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }

    // 퍼센트 계산
    private void calculatePercent(Settlement settlement, Long totalAmount, User payer, List<PercentSettlementEntry> entries) {
        if (entries == null || entries.isEmpty()) throw new IllegalArgumentException("퍼센트 정산 내역이 없습니다.");

        List<SettlementDetail> details = new ArrayList<>();
        for (PercentSettlementEntry entry : entries) {
            User debtor = userRepository.findById(entry.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("참여자를 찾을 수 없습니다."));

            // 비율 계산: (총액 * 비율) / 100 -> 정수 변환
            Long amountForThisUser = (long) (totalAmount * (entry.getRatio() / 100.0));

            if (debtor.getId().equals(payer.getId())) continue;

            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(debtor)
                    .creditor(payer)
                    .amount(amountForThisUser)
                    .build();
            details.add(detail);
        }
        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }

    private void calculateItem(Settlement settlement, User payer, Expense expense) {
        Vote vote = voteRepository.findByExpense(expense)
                .orElseThrow(() -> new IllegalArgumentException("투표 내역이 없습니다. 먼저 투표를 생성해주세요."));

        List<SettlementDetail> details = new ArrayList<>();

        // 1. 각 항목(VoteOption)별로 루프를 돕니다.
        for (VoteOption option : vote.getOptions()) {
            List<UserVote> votes = userVoteRepository.findByVoteOption(option);

            if (votes.isEmpty()) {
                // 아무도 안 먹은 메뉴? -> 일단 결제자 부담 or N빵 (여기선 패스)
                continue;
            }

            // 2. 이 메뉴의 가격을 먹은 사람 수로 나눕니다.
            long price = option.getExpenseItem().getPrice().longValue(); // BigDecimal -> Long
            long splitPrice = price / votes.size();

            // 3. 먹은 사람들에게 청구
            for (UserVote uv : votes) {
                User eater = uv.getUser();
                if (eater.getId().equals(payer.getId())) continue; // 결제자 본인은 제외

                // 이미 이 사람에 대한 Detail이 있는지 확인 (같은 사람이 여러 메뉴 먹었을 수 있음)
                SettlementDetail detail = details.stream()
                        .filter(d -> d.getDebtor().getId().equals(eater.getId()))
                        .findFirst()
                        .orElse(null);

                if (detail == null) {
                    // 처음 추가되는 사람이면 새로 생성
                    detail = SettlementDetail.builder()
                            .settlement(settlement)
                            .debtor(eater)
                            .creditor(payer)
                            .amount(0L)
                            .build();
                    details.add(detail);
                }

                // 금액 누적
                detail.addAmount(splitPrice);
            }
        }

        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }
}