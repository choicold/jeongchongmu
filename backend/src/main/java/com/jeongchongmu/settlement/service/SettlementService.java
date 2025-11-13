package com.jeongchongmu.settlement.service;

// '지출' 팀의 Repository (DB에서 Expense 정보를 가져오기 위해)
import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.repository.ExpenseRepository; // <-- 이 파일이 필요합니다!

// '사용자' 팀의 Repository (DB에서 User 정보를 가져오기 위해)
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository; // <-- 이 파일이 필요합니다!

// '정산' 도메인의 DTO, Entity, Repository
import com.jeongchongmu.settlement.dto.DirectSettlementEntry;
import com.jeongchongmu.settlement.dto.PercentSettlementEntry;
import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.entity.SettlementDetail;
import com.jeongchongmu.settlement.enums.SettlementMethod;
import com.jeongchongmu.settlement.repository.SettlementDetailRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor // Repository들을 생성자 주입
@Transactional(readOnly = true) // 기본적으로는 조회(읽기)만
public class SettlementService {

    // 정산 Repository
    private final SettlementRepository settlementRepository;
    private final SettlementDetailRepository settlementDetailRepository;

    // 다른 도메인의 Repository 주입
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;


    /**
     * 정산 생성 (핵심 로직)
     */
    @Transactional // 이 메서드는 DB에 쓰기 작업을 하므로 @Transactional
    public SettlementResponse createSettlement(SettlementCreateRequest request) {

        // 1. 원본 지출(Expense) 내역 조회
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지출 내역입니다."));

        BigDecimal totalAmount = expense.getAmount(); // 총액
        User payer = expense.getPayer(); // 결제자
        List<User> participants = expense.getParticipants().stream()
                .map(ep -> ep.getUser()) // ExpenseParticipant에서 User 객체 추출
                .toList();

        // 2. Settlement (정산 마스터) 엔티티 생성 및 저장
        Settlement newSettlement = Settlement.builder()
                .expense(expense)
                .method(request.getMethod())
                .status(SettlementStatus.PENDING) // 상태는 '진행중'
                .build();

        settlementRepository.save(newSettlement); // DB에 먼저 저장

        // 3. 정산 방식(method)에 따라 계산 로직 분기
        // (계산 결과인 SettlementDetail 리스트가 생성됨)
        switch (request.getMethod()) {
            case N_BUN_1 ->
                    calculateN분의1(newSettlement, totalAmount, payer, participants);

            case DIRECT ->
                    calculateDirect(newSettlement, payer, request.getDirectEntries());

            case PERCENT ->
                    calculatePercent(newSettlement, totalAmount, payer, request.getPercentEntries());

            case ITEM ->
                // 지금은 항목별 정산을 구현하지 않으므로 예외 처리
                    throw new IllegalArgumentException("항목별 정산은 아직 지원되지 않습니다.");
        }

        // 4. 생성된 정산 내역(SettlementDetail 포함)을 DTO로 변환하여 반환
        // (JPA가 트랜잭션 내에서 newSettlement 객체에 details를 자동으로 채워줌)
        return SettlementResponse.from(newSettlement, totalAmount);
    }


    /**
     * 1. N분의 1 정산 계산
     */
    private void calculateN분의1(Settlement settlement, BigDecimal totalAmount, User payer, List<User> participants) {

        int participantCount = participants.size();
        if (participantCount == 0) {
            throw new IllegalArgumentException("참여자가 없습니다.");
        }

        // 1인당 금액 계산 (총액 / N), 소수점 둘째 자리까지 반올림
        BigDecimal amountPerPerson = totalAmount.divide(
                new BigDecimal(participantCount), 2, RoundingMode.HALF_UP
        );

        List<SettlementDetail> details = new ArrayList<>();

        for (User participant : participants) {
            // 결제자(payer)는 돈을 받아야 하므로 skip
            if (participant.getId().equals(payer.getId())) {
                continue;
            }

            // 결제자가 아닌 참여자(debtor)가 결제자(creditor)에게 돈을 보냄
            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(participant)     // 돈 보내는 사람
                    .creditor(payer)         // 돈 받는 사람 (결제자)
                    .amount(amountPerPerson) // 1/N 금액
                    .build();
            details.add(detail);
        }

        // 계산된 상세 내역들을 DB에 한 번에 저장
        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details); // (선택) 영속성 컨텍스트 동기화
    }

    /**
     * 2. 직접 정산
     */
    private void calculateDirect(Settlement settlement, User payer, List<DirectSettlementEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            throw new IllegalArgumentException("직접 정산 내역이 없습니다.");
        }

        List<SettlementDetail> details = new ArrayList<>();

        for (DirectSettlementEntry entry : entries) {
            User debtor = userRepository.findById(entry.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("참여자를 찾을 수 없습니다."));

            // 결제자 본인이면 스킵
            if (debtor.getId().equals(payer.getId())) {
                continue;
            }

            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(debtor)
                    .creditor(payer)
                    .amount(entry.getAmount()) // DTO에 적힌 금액 그대로
                    .build();
            details.add(detail);
        }

        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }

    /**
     * 3. 퍼센트 정산
     */
    private void calculatePercent(Settlement settlement, BigDecimal totalAmount, User payer, List<PercentSettlementEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            throw new IllegalArgumentException("퍼센트 정산 내역이 없습니다.");
        }

        // (선택) 비율의 총합이 100%인지 검증하는 로직 추가 가능
        // double totalRatio = entries.stream().mapToDouble(PercentSettlementEntry::getRatio).sum();
        // if (Math.abs(totalRatio - 100.0) > 0.01) { ... }

        List<SettlementDetail> details = new ArrayList<>();

        for (PercentSettlementEntry entry : entries) {
            User debtor = userRepository.findById(entry.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("참여자를 찾을 수 없습니다."));

            // 비율(%)로 금액 계산
            // (총액 * (비율 / 100.0)), 소수점 둘째 자리 반올림
            BigDecimal ratio = new BigDecimal(entry.getRatio()).divide(new BigDecimal(100.0));
            BigDecimal amountForThisUser = totalAmount.multiply(ratio)
                    .setScale(2, RoundingMode.HALF_UP);

            // 결제자 본인이면 스킵
            if (debtor.getId().equals(payer.getId())) {
                continue;
            }

            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(debtor)
                    .creditor(payer)
                    .amount(amountForThisUser) // 계산된 금액
                    .build();
            details.add(detail);
        }

        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }

}