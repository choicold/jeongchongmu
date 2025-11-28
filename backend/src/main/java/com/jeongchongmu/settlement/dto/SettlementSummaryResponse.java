package com.jeongchongmu.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자의 정산 현황 요약 응답 DTO
 * 사용자가 받아야 할 돈과 보내야 할 돈의 총계를 반환합니다.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementSummaryResponse {

    /**
     * 받아야 할 총 금액 (내가 채권자인 경우의 합계)
     */
    private Long toReceive;

    /**
     * 보내야 할 총 금액 (내가 채무자인 경우의 합계)
     */
    private Long toSend;
}
