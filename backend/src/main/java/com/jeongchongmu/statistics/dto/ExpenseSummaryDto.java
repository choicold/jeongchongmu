package com.jeongchongmu.statistics.dto;

public record ExpenseSummaryDto(
        Long totalAmount,
        Long totalCount,
        Long maxAmount
){}
