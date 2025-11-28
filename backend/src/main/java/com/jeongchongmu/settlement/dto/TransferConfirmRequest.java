package com.jeongchongmu.settlement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 송금 확인 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TransferConfirmRequest {

    private Long debtorId;    // 채무자(송금하는 사람) ID
    private Long creditorId;  // 채권자(받는 사람) ID
}
