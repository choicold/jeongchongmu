package com.jeongchongmu.statistics;


import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.statistics.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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


    /**
     * 사용자별 월간 통계 조회
     *
     * @param groupId 그룹 ID
     * @param year 연도
     * @param month 월
     * @param userId 사용자 ID (통계를 조회할 사용자)
     * @return 사용자별 월간 통계 데이터
     *
     * 로직:
     * - 내가 결제자인 경우: 정산이 있으면 내 채무만, 정산이 없으면 전체 금액
     * - 내가 참여자인 경우: 정산이 있으면 내 채무만, 정산이 없으면 제외
     */
    @Transactional(readOnly = true)
    public MonthlyStatisticsResponseDto getMonthlyStatistics(Long groupId, int year, int month, Long userId){
        // 1. 사용자별 지출 총액 (정산 기반 계산)
        Long userTotalExpense = expenseRepository.findUserMonthlyExpenseTotal(groupId, year, month, userId);

        // 2. 사용자별 카테고리 통계 (정산 기반)
        List<CategorySummaryDto> categoryStatistics = expenseRepository.findUserMonthlyCategoryStatistics(groupId, year, month, userId);

        // 3. 가장 큰 지출 (그룹 전체 기준 - 참고용)
        List<TopExpenseDto> topExpenses = expenseRepository.findTopExpense(groupId, year, month, PageRequest.of(0, 1));
        TopExpenseDto topExpense = topExpenses.isEmpty() ? null : topExpenses.getFirst();

        // 4. 정산 요약 (그룹 전체 기준)
        SettlementSummaryDto settlementSummary = settlementRepository.findMonthlySettlementSummary(groupId, year, month);

        // 5. 미완료 정산 목록 (그룹 전체 기준)
        List<SettlementSummaryItemDto> incompletedSettlements = settlementRepository.findIncompletedSettlements(groupId, year, month);

        // 6. [연간 차트 로직] 사용자별 1~12월 데이터 채우기
        List<MonthlyExpenseStatDto> yearlyRawData = expenseRepository.findUserYearlyStatistics(groupId, year, userId);
        Map<Integer, Long> monthlyMap = yearlyRawData.stream()
                .collect(Collectors.toMap(MonthlyExpenseStatDto::month, MonthlyExpenseStatDto::amount));

        List<Long> yearlyStatistics = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            yearlyStatistics.add(monthlyMap.getOrDefault(i, 0L));
        }

        // 7. 지출 건수 계산 (카테고리 통계가 있으면 지출이 있다고 간주)
        long expenseCount = categoryStatistics.isEmpty() ? 0L : categoryStatistics.size();

        return MonthlyStatisticsResponseDto.builder()
                // --- 사용자별 지출 총액 (정산 기반) ---
                .totalExpenseAmount(userTotalExpense != null ? userTotalExpense : 0L)
                .totalExpenseCount(expenseCount)

                // --- 사용자별 카테고리 리스트 (정산 기반) ---
                .categories(categoryStatistics != null ? categoryStatistics : Collections.emptyList())

                // --- 가장 큰 지출 (그룹 전체 기준, 참고용) ---
                .topExpense(topExpense)

                // --- 정산 관련 (그룹 전체 기준) ---
                .totalSettlementCount(settlementSummary != null && settlementSummary.totalCount() != null ? settlementSummary.totalCount() : 0L)
                .notCompletedSettlementCount(settlementSummary != null && settlementSummary.notCompletedCount() != null ? settlementSummary.notCompletedCount() : 0L)

                // --- 미완료 정산 리스트 (그룹 전체 기준) ---
                .incompletedSettlements(incompletedSettlements != null ? incompletedSettlements : Collections.emptyList())

                // --- 사용자별 연간 통계 (정산 기반) ---
                .yearlyStatistics(yearlyStatistics)
                .build();
    }

    /**
     * 개인 전체 월간 통계 조회 (모든 그룹 합산)
     *
     * @param year 연도
     * @param month 월
     * @param userId 사용자 ID
     * @return 개인 전체 월간 통계 데이터
     *
     * 로직:
     * - 모든 그룹의 지출을 합산
     * - 내가 결제자인 경우: 정산이 있으면 내 채무만, 정산이 없으면 전체 금액
     * - 내가 참여자인 경우: 정산이 있으면 내 채무만, 정산이 없으면 제외
     */
    @Transactional(readOnly = true)
    public MonthlyStatisticsResponseDto getUserTotalStatistics(int year, int month, Long userId){
        // 1. 개인 전체 지출 총액 (모든 그룹 합산)
        Long userTotalExpense = expenseRepository.findUserTotalMonthlyExpense(year, month, userId);

        // 2. 개인 전체 카테고리 통계 (모든 그룹 합산)
        List<CategorySummaryDto> categoryStatistics = expenseRepository.findUserTotalMonthlyCategoryStatistics(year, month, userId);

        // 3. 개인 전체 연간 통계 (모든 그룹 합산)
        List<MonthlyExpenseStatDto> yearlyRawData = expenseRepository.findUserTotalYearlyStatistics(year, userId);
        Map<Integer, Long> monthlyMap = yearlyRawData.stream()
                .collect(Collectors.toMap(MonthlyExpenseStatDto::month, MonthlyExpenseStatDto::amount));

        List<Long> yearlyStatistics = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            yearlyStatistics.add(monthlyMap.getOrDefault(i, 0L));
        }

        // 4. 지출 건수 계산
        long expenseCount = categoryStatistics.isEmpty() ? 0L : categoryStatistics.size();

        return MonthlyStatisticsResponseDto.builder()
                // --- 개인 전체 지출 총액 ---
                .totalExpenseAmount(userTotalExpense != null ? userTotalExpense : 0L)
                .totalExpenseCount(expenseCount)

                // --- 개인 전체 카테고리 리스트 ---
                .categories(categoryStatistics != null ? categoryStatistics : Collections.emptyList())

                // --- 개인 통계에서는 사용하지 않는 필드 (null 또는 0) ---
                .topExpense(null)
                .totalSettlementCount(0L)
                .notCompletedSettlementCount(0L)
                .incompletedSettlements(Collections.emptyList())

                // --- 개인 전체 연간 통계 ---
                .yearlyStatistics(yearlyStatistics)
                .build();
    }

}
