package com.jeongchongmu.settlement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PercentSettlementEntry { // 퍼센트 정산
    private Long userId; // 이 사용자가
    private Double ratio;  // 이 비율(%)만큼 부담한다 (예: 60.5%)
}