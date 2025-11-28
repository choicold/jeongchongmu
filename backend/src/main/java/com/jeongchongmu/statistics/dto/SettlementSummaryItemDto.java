package com.jeongchongmu.statistics.dto;

/**
 * 정산 요약 항목 DTO
 * 미완료 정산 목록에 사용됩니다.
 */
public record SettlementSummaryItemDto(
        Long settlementId,
        Long expenseId,
        String title,
        Long amount
) { }
