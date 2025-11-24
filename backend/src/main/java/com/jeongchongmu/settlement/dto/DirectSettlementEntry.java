package com.jeongchongmu.settlement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DirectSettlementEntry { // 직접 정산
    private Long userId; // 이 사용자가
    private Long amount; // 이만큼 부담한다
}