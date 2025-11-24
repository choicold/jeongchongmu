package com.jeongchongmu.settlement.dto;

import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.enums.SettlementMethod;
import com.jeongchongmu.settlement.enums.SettlementStatus;
import lombok.Builder;
import lombok.Getter;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder // 이 DTO는 서비스 로직에서 생성하므로 Builder가 편합니다.
public class SettlementResponse {

    private Long settlementId;
    private Long expenseId;
    private SettlementMethod method;
    private SettlementStatus status;
    private Long totalAmount; // 정산 대상 총 금액 (Expense에서 가져옴)

    // "누가 누구에게 얼마를" 보내야 하는지 상세 내역 리스트
    private List<SettlementDetailDto> details;

    // Entity(Settlement)를 Response DTO로 변환하는 정적 메서드 (강력 추천!)
    public static SettlementResponse from(Settlement settlement, Long totalAmount) {
        return SettlementResponse.builder()
                .settlementId(settlement.getId())
                .expenseId(settlement.getExpense().getId())
                .method(settlement.getMethod())
                .status(settlement.getStatus())
                .totalAmount(totalAmount)
                .details(
                        settlement.getDetails().stream() // SettlementDetail 엔티티 목록
                                .map(SettlementDetailDto::from) // SettlementDetailDto로 변환
                                .collect(Collectors.toList())
                )
                .build();
    }
}