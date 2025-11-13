package com.jeongchongmu.settlement.service;

// 1. Spring Framework & Lombok
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 2. Java 기본 클래스
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

// 3. '지출' 도메인
import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.repository.ExpenseRepository;

// 4. '그룹' 도메인
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;

// 5. '유저' 도메인
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;

// 6. '정산' 도메인 (우리가 만든 것)
import com.jeongchongmu.settlement.dto.DirectSettlementEntry;
import com.jeongchongmu.settlement.dto.PercentSettlementEntry;
import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.entity.SettlementDetail;
import com.jeongchongmu.settlement.enums.SettlementMethod; // enum
import com.jeongchongmu.settlement.enums.SettlementStatus; // enum
import com.jeongchongmu.settlement.repository.SettlementDetailRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    // 정산 Repository
    private final SettlementRepository settlementRepository;
    private final SettlementDetailRepository settlementDetailRepository;

    // 다른 도메인의 Repository 주입
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    //  그룹 멤버 검증을 위해 추가
    private final GroupMemberRepository groupMemberRepository;


    /**
     * 정산 생성
     */
    @Transactional
    public SettlementResponse createSettlement(SettlementCreateRequest request) {

        // 1. 원본 지출(Expense) 내역 조회 (총액, 결제자 정보 획득)
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지출 내역입니다."));

        BigDecimal totalAmount = expense.getAmount(); // 총액
        User payer = expense.getPayer(); // 결제자
        Group group = expense.getGroup(); // 이 지출이 속한 그룹

        // 2. 참여자 선택 및 검증 (시나리오 변경점)
        // DTO로 넘겨받은 userId 목록으로 실제 User 엔티티 목록을 조회
        List<User> participants = userRepository.findAllById(request.getParticipantUserIds());

        // (선택사항) 요청한 ID의 유저가 DB에 다 있는지 확인
        if (participants.size() != request.getParticipantUserIds().size()) {
            throw new IllegalArgumentException("참여 멤버 중 존재하지 않는 유저가 있습니다.");
        }

        //  이 유저들이 *정말로* 이 그룹의 멤버가 맞는지 확인
        // (GroupMemberRepositoryTest 3번의 existsByUserAndGroup 활용)
        for (User user : participants) {
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                throw new IllegalStateException("그룹 멤버가 아닌 유저가 정산에 포함되었습니다: " + user.getName());
            }
        }

        // 3. Settlement (정산 마스터) 엔티티 생성 및 저장
        Settlement newSettlement = Settlement.builder()
                .expense(expense)
                .method(request.getMethod())
                .status(SettlementStatus.PENDING)
                .build();

        settlementRepository.save(newSettlement);

        // 4. 정산 방식(method)에 따라 계산 로직 분기
        // (!!중요!!) calculate... 메서드들은 수정할 필요가 *없습니다*.
        // 왜냐하면, 우리는 '검증된 참여자 목록(participants)'을
        // 인자로 넘겨주기만 하면 되기 때문입니다.

        switch (request.getMethod()) {
            case N_BUN_1 ->
                    calculateDivide(newSettlement, totalAmount, payer, participants);

            case DIRECT ->
                    calculateDirect(newSettlement, payer, request.getDirectEntries());

            case PERCENT ->
                    calculatePercent(newSettlement, totalAmount, payer, request.getPercentEntries());

            case ITEM ->
                    throw new IllegalArgumentException("항목별 정산은 아직 지원되지 않습니다.");
        }

        // 5. 생성된 정산 내역(SettlementDetail 포함)을 DTO로 변환하여 반환
        return SettlementResponse.from(newSettlement, totalAmount);
    }


    /*
     * * private void calculateN분의1(...) { ... }
     * private void calculateDirect(...) { ... }
     * private void calculatePercent(...) { ... }
     * * >>> 이 3개의 계산 메서드들은
     * 이전 코드와 100% 동일하므로 수정할 필요가 없습니다.
     * */

    // (이전과 동일한 calculateN분의1 메서드)
    private void calculateDivide(Settlement settlement, BigDecimal totalAmount, User payer, List<User> participants) {
        int participantCount = participants.size();
        if (participantCount == 0) throw new IllegalArgumentException("참여자가 없습니다.");
        BigDecimal amountPerPerson = totalAmount.divide(new BigDecimal(participantCount), 2, RoundingMode.HALF_UP);
        List<SettlementDetail> details = new ArrayList<>();
        for (User participant : participants) {
            if (participant.getId().equals(payer.getId())) continue;
            SettlementDetail detail = SettlementDetail.builder()
                    .settlement(settlement)
                    .debtor(participant)
                    .creditor(payer)
                    .amount(amountPerPerson)
                    .build();
            details.add(detail);
        }
        settlementDetailRepository.saveAll(details);
        settlement.getDetails().addAll(details);
    }

    // (이전과 동일한 calculateDirect 메서드)
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

    // (이전과 동일한 calculatePercent 메서드)
    private void calculatePercent(Settlement settlement, BigDecimal totalAmount, User payer, List<PercentSettlementEntry> entries) {
        if (entries == null || entries.isEmpty()) throw new IllegalArgumentException("퍼센트 정산 내역이 없습니다.");
        List<SettlementDetail> details = new ArrayList<>();
        for (PercentSettlementEntry entry : entries) {
            User debtor = userRepository.findById(entry.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("참여자를 찾을 수 없습니다."));
            BigDecimal ratio = new BigDecimal(entry.getRatio()).divide(new BigDecimal(100.0));
            BigDecimal amountForThisUser = totalAmount.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
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
}