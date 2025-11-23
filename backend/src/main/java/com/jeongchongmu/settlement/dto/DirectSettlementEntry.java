package com.jeongchongmu.settlement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class DirectSettlementEntry {
    private Long userId; // 이 사용자가
    private Long amount; // 이만큼 부담한다
}