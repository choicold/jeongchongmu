package com.jeongchongmu.statistics;


import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.statistics.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;


    @Transactional(readOnly = true)
    public MonthlyStatisticsResponseDto getMonthlyStatistics(Long groupId, int year, int month){
        // 1. 지출 요약 (총액, 횟수, 최대값)
        ExpenseSummaryDto expenseSummary = expenseRepository.findMonthlyExpenseSummary(groupId, year, month);

        // 2. 카테고리별 통계
        List<CategorySummaryDto> categoryStatistics = expenseRepository.findMonthlyCategoryStatistics(groupId, year, month);

        // 3. 가장 큰 지출 (1건만 필요하므로 PageRequest 사용)
        List<TopExpenseDto> topExpenses = expenseRepository.findTopExpense(groupId, year, month, PageRequest.of(0, 1));
        TopExpenseDto topExpense = topExpenses.isEmpty() ? null : topExpenses.getFirst();

        // 4. 정산 요약 (총 횟수, 미완료 횟수)
        SettlementSummaryDto settlementSummary = settlementRepository.findMonthlySettlementSummary(groupId, year, month);

        // 5. 미완료 정산 목록
        List<TopExpenseDto> incompletedSettlements = settlementRepository.findIncompletedSettlements(groupId, year, month);

        // 2. [연간 차트 로직] 1~12월 데이터 채우기
        List<MonthlyExpenseStatDto> yearlyRawData = expenseRepository.findYearlyStatistics(groupId, year);
        Map<Integer, Long> monthlyMap = yearlyRawData.stream()
                .collect(Collectors.toMap(MonthlyExpenseStatDto::month, MonthlyExpenseStatDto::amount));

        List<Long> yearlyStatistics = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            yearlyStatistics.add(monthlyMap.getOrDefault(i, 0L));
        }

        return MonthlyStatisticsResponseDto.builder()
                // --- 지출 관련 (데이터가 없으면 0으로 처리) ---
                .totalExpenseAmount(expenseSummary != null && expenseSummary.totalAmount() != null ? expenseSummary.totalAmount() : 0L)
                .totalExpenseCount(expenseSummary != null && expenseSummary.totalCount() != null ? expenseSummary.totalCount() : 0L)

                // --- 카테고리 리스트 (null이면 빈 리스트 반환) ---
                .categories(categoryStatistics != null ? categoryStatistics : Collections.emptyList())

                // --- 가장 큰 지출 (없으면 null) ---
                .topExpense(topExpense)

                // --- 정산 관련 (데이터가 없으면 0으로 처리) ---
                .totalSettlementCount(settlementSummary != null && settlementSummary.totalCount() != null ? settlementSummary.totalCount() : 0L)
                .notCompletedSettlementCount(settlementSummary != null && settlementSummary.notCompletedCount() != null ? settlementSummary.notCompletedCount() : 0L)

                // --- 미완료 정산 리스트 ---
                .incompletedSettlements(incompletedSettlements != null ? incompletedSettlements : Collections.emptyList())
                .yearlyStatistics(yearlyStatistics)
                .build();



    }

    @Transactional(readOnly = true)
    public MonthlyStatisticsResponseDto getMonthlyStatistics(Long groupId, Integer year, Integer month) {
        LocalDateTime now = LocalDateTime.now();
        int currentYear = (year != null) ? year : now.getYear();
        int currentMonth = (month != null) ? month : now.getMonthValue();

        // 🔥 핵심: year/month가 둘 다 null이면 전체 기간 조회
        boolean isAllTime = (year == null && month == null);

        // 1. 지출 요약
        ExpenseSummaryDto expenseSummary;
        if (isAllTime) {
            expenseSummary = expenseRepository.findAllTimeExpenseSummary(groupId);
        } else {
            expenseSummary = expenseRepository.findMonthlyExpenseSummary(groupId, currentYear, currentMonth);
        }

        // 2. 카테고리별 통계
        List<CategorySummaryDto> categoryStatistics;
        if (isAllTime) {
            categoryStatistics = expenseRepository.findAllTimeCategoryStatistics(groupId);
        } else {
            categoryStatistics = expenseRepository.findMonthlyCategoryStatistics(groupId, currentYear, currentMonth);
        }

        // 3. 가장 큰 지출
        List<TopExpenseDto> topExpenses;
        if (isAllTime) {
            topExpenses = expenseRepository.findAllTimeTopExpense(groupId, PageRequest.of(0, 1));
        } else {
            topExpenses = expenseRepository.findTopExpense(groupId, currentYear, currentMonth, PageRequest.of(0, 1));
        }
        TopExpenseDto topExpense = topExpenses.isEmpty() ? null : topExpenses.getFirst();

        // 4. 정산 요약
        SettlementSummaryDto settlementSummary;
        if (isAllTime) {
            settlementSummary = settlementRepository.findAllTimeSettlementSummary(groupId);
        } else {
            settlementSummary = settlementRepository.findMonthlySettlementSummary(groupId, currentYear, currentMonth);
        }

        // 5. 미완료 정산 목록
        List<TopExpenseDto> incompletedSettlements;
        if (isAllTime) {
            incompletedSettlements = settlementRepository.findAllTimeIncompletedSettlements(groupId);
        } else {
            incompletedSettlements = settlementRepository.findIncompletedSettlements(groupId, currentYear, currentMonth);
        }

        // 6. 연간 통계
        List<Long> yearlyStatistics = new ArrayList<>();
        if (isAllTime) {
            yearlyStatistics = Collections.nCopies(12, 0L); // 전체 기간이므로 월별 의미 없음
        } else {
            List<MonthlyExpenseStatDto> yearlyRawData = expenseRepository.findYearlyStatistics(groupId, currentYear);
            Map<Integer, Long> monthlyMap = yearlyRawData.stream()
                    .collect(Collectors.toMap(MonthlyExpenseStatDto::month, MonthlyExpenseStatDto::amount));

            for (int i = 1; i <= 12; i++) {
                yearlyStatistics.add(monthlyMap.getOrDefault(i, 0L));
            }
        }

        return MonthlyStatisticsResponseDto.builder()
                .totalExpenseAmount(expenseSummary != null && expenseSummary.totalAmount() != null ? expenseSummary.totalAmount() : 0L)
                .totalExpenseCount(expenseSummary != null && expenseSummary.totalCount() != null ? expenseSummary.totalCount() : 0L)
                .categories(categoryStatistics != null ? categoryStatistics : Collections.emptyList())
                .topExpense(topExpense)
                .totalSettlementCount(settlementSummary != null && settlementSummary.totalCount() != null ? settlementSummary.totalCount() : 0L)
                .notCompletedSettlementCount(settlementSummary != null && settlementSummary.notCompletedCount() != null ? settlementSummary.notCompletedCount() : 0L)
                .incompletedSettlements(incompletedSettlements != null ? incompletedSettlements : Collections.emptyList())
                .yearlyStatistics(yearlyStatistics)
                .build();
    }

}
