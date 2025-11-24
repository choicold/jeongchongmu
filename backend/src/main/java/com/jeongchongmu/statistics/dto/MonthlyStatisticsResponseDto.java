package com.jeongchongmu.statistics.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record MonthlyStatisticsResponseDto(
        Long totalExpenseAmount,
        Long totalExpenseCount,

        List<CategorySummaryDto> categories,
        TopExpenseDto topExpense,

        Long totalSettlementCount,
        Long notCompletedSettlementCount,

        List<TopExpenseDto> incompletedSettlements,

        List<Long> yearlyStatistics

) {
}
