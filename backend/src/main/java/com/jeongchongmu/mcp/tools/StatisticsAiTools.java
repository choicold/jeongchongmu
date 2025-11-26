package com.jeongchongmu.mcp.tools;

import com.jeongchongmu.statistics.StatisticsService;
import com.jeongchongmu.statistics.dto.*;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class StatisticsAiTools {

    private final StatisticsService statisticsService;
    private final UserRepository userRepository;

    // =================================================================================
    // 1. 월별 통계 조회 (메인 기능)
    // =================================================================================

    @Tool(description = "특정 그룹의 월별 지출 및 정산 통계를 종합적으로 조회합니다. 총 지출액, 카테고리별 통계, 가장 큰 지출, 정산 현황, 연간 차트 데이터를 모두 제공합니다.")
    public String getMonthlyStatistics(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "조회할 연도 (예: 2024)", required = false) Integer year,
            @ToolParam(description = "조회할 월 (1~12)", required = false) Integer month
    ) {
        try {
            // 연도/월이 지정되지 않으면 현재 날짜 사용
            LocalDate now = LocalDate.now();
            int targetYear = (year != null) ? year : now.getYear();
            int targetMonth = (month != null) ? month : now.getMonthValue();

            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(groupId, targetYear, targetMonth);

            StringBuilder result = new StringBuilder();
            result.append(String.format("📊 %d년 %d월 통계\n\n", targetYear, targetMonth));

            // 1. 지출 요약
            result.append("💰 **지출 현황**\n");
            result.append(String.format("- 총 지출액: %,d원\n", stats.totalExpenseAmount()));
            result.append(String.format("- 지출 건수: %d건\n\n", stats.totalExpenseCount()));

            // 2. 카테고리별 통계
            if (stats.categories() != null && !stats.categories().isEmpty()) {
                result.append("🏷️ **카테고리별 지출**\n");
                for (CategorySummaryDto category : stats.categories()) {
                    result.append(String.format("- %s: %,d원\n",
                            category.tagName(),
                            category.totalAmount()));
                }
                result.append("\n");
            }

            // 3. 가장 큰 지출
            if (stats.topExpense() != null) {
                result.append("🔝 **최대 지출**\n");
                result.append(String.format("- %s: %,d원 (ID: %d)\n\n",
                        stats.topExpense().title(),
                        stats.topExpense().amount(),
                        stats.topExpense().id()));
            }

            // 4. 정산 현황
            result.append("💳 **정산 현황**\n");
            result.append(String.format("- 총 정산: %d건\n", stats.totalSettlementCount()));
            result.append(String.format("- 미완료: %d건\n\n", stats.notCompletedSettlementCount()));

            // 5. 미완료 정산 상세
            if (stats.incompletedSettlements() != null && !stats.incompletedSettlements().isEmpty()) {
                result.append("⏳ **미완료 정산 목록**\n");
                for (TopExpenseDto settlement : stats.incompletedSettlements()) {
                    result.append(String.format("- %s: %,d원 (ID: %d)\n",
                            settlement.title(),
                            settlement.amount(),
                            settlement.id()));
                }
                result.append("\n");
            }

            // 6. 연간 트렌드 요약
            if (stats.yearlyStatistics() != null && !stats.yearlyStatistics().isEmpty()) {
                result.append("📈 **연간 지출 추이**\n");
                List<Long> yearly = stats.yearlyStatistics();

                // 최대/최소 지출 월 찾기
                long maxAmount = 0;
                int maxMonth = 0;
                long minAmount = Long.MAX_VALUE;
                int minMonth = 0;

                for (int i = 0; i < yearly.size(); i++) {
                    long amount = yearly.get(i);
                    if (amount > maxAmount) {
                        maxAmount = amount;
                        maxMonth = i + 1;
                    }
                    if (amount > 0 && amount < minAmount) {
                        minAmount = amount;
                        minMonth = i + 1;
                    }
                }

                if (maxMonth > 0) {
                    result.append(String.format("- 최대 지출 월: %d월 (%,d원)\n", maxMonth, maxAmount));
                }
                if (minMonth > 0 && minAmount != Long.MAX_VALUE) {
                    result.append(String.format("- 최소 지출 월: %d월 (%,d원)\n", minMonth, minAmount));
                }

                // 평균 지출
                long sum = yearly.stream().mapToLong(Long::longValue).sum();
                long nonZeroCount = yearly.stream().filter(v -> v > 0).count();
                if (nonZeroCount > 0) {
                    long avg = sum / nonZeroCount;
                    result.append(String.format("- 월 평균 지출: %,d원\n", avg));
                }
            }

            return result.toString().trim();

        } catch (Exception e) {
            return "❌ 통계 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 2. 간단한 요약 통계
    // =================================================================================

    @Tool(description = "특정 그룹의 월별 지출 요약만 간단하게 조회합니다. 총 지출액과 건수만 빠르게 확인할 때 사용하세요.")
    public String getExpenseSummary(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "조회할 연도 (예: 2024)", required = false) Integer year,
            @ToolParam(description = "조회할 월 (1~12)", required = false) Integer month
    ) {
        try {
            LocalDate now = LocalDate.now();
            int targetYear = (year != null) ? year : now.getYear();
            int targetMonth = (month != null) ? month : now.getMonthValue();

            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(groupId, targetYear, targetMonth);

            return String.format(
                    "💰 %d년 %d월 지출 요약\n" +
                            "- 총 지출: %,d원\n" +
                            "- 지출 건수: %d건",
                    targetYear, targetMonth,
                    stats.totalExpenseAmount(),
                    stats.totalExpenseCount()
            );

        } catch (Exception e) {
            return "❌ 지출 요약 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 3. 카테고리별 분석
    // =================================================================================
    @Tool(description = "그룹의 카테고리별 지출 통계를 분석합니다. 연도/월을 지정하지 않으면 이번 달 통계를 조회합니다.")
    public String getCategoryAnalysis(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "연도 (선택, 예: 2025)", required = false) Integer year,
            @ToolParam(description = "월 (선택, 1-12)", required = false) Integer month,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);
        try {
            User user = getUser(userId);

            // year와 month가 둘 다 null이면 현재 년월 사용
            LocalDateTime now = LocalDateTime.now();
            int targetYear = (year != null) ? year : now.getYear();
            int targetMonth = (month != null) ? month : now.getMonthValue();

            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(
                    groupId, targetYear, targetMonth
            );

            return formatCategoryStats(stats, targetYear, targetMonth);
        } catch (Exception e) {
            log.error("Category Analysis Error", e);
            return "❌ 통계 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 4. 정산 현황 분석
    // =================================================================================

    @Tool(description = "특정 월의 정산 현황을 분석합니다. 완료/미완료 정산 건수와 미완료 정산 상세 내역을 제공합니다.")
    public String getSettlementAnalysis(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "조회할 연도 (예: 2024)", required = false) Integer year,
            @ToolParam(description = "조회할 월 (1~12)", required = false) Integer month
    ) {
        try {
            LocalDate now = LocalDate.now();
            int targetYear = (year != null) ? year : now.getYear();
            int targetMonth = (month != null) ? month : now.getMonthValue();

            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(groupId, targetYear, targetMonth);

            StringBuilder result = new StringBuilder();
            result.append(String.format("💳 %d년 %d월 정산 현황\n\n", targetYear, targetMonth));

            long totalCount = stats.totalSettlementCount();
            long incompletedCount = stats.notCompletedSettlementCount();
            long completedCount = totalCount - incompletedCount;

            result.append(String.format("- 전체 정산: %d건\n", totalCount));
            result.append(String.format("- 완료: %d건 ✅\n", completedCount));
            result.append(String.format("- 미완료: %d건 ⏳\n\n", incompletedCount));

            if (incompletedCount > 0 && stats.incompletedSettlements() != null) {
                result.append("**미완료 정산 상세**\n");
                for (TopExpenseDto settlement : stats.incompletedSettlements()) {
                    result.append(String.format("- %s: %,d원 (ID: %d)\n",
                            settlement.title(),
                            settlement.amount(),
                            settlement.id()));
                }
            } else if (totalCount > 0) {
                result.append("✅ 모든 정산이 완료되었습니다!");
            } else {
                result.append("📋 정산 내역이 없습니다.");
            }

            return result.toString().trim();

        } catch (Exception e) {
            return "❌ 정산 현황 분석 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 5. 연간 트렌드 분석
    // =================================================================================

    @Tool(description = "특정 연도의 월별 지출 추이를 분석합니다. 1~12월의 지출 패턴과 트렌드를 확인할 수 있습니다.")
    public String getYearlyTrend(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "조회할 연도 (예: 2024)", required = false) Integer year
    ) {
        try {
            LocalDate now = LocalDate.now();
            int targetYear = (year != null) ? year : now.getYear();

            // 임의의 월로 조회 (연간 데이터는 어느 월을 조회해도 동일)
            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(groupId, targetYear, 1);

            if (stats.yearlyStatistics() == null || stats.yearlyStatistics().isEmpty()) {
                return String.format("📈 %d년 연간 지출 데이터가 없습니다.", targetYear);
            }

            StringBuilder result = new StringBuilder();
            result.append(String.format("📈 %d년 월별 지출 추이\n\n", targetYear));

            List<Long> yearly = stats.yearlyStatistics();
            long yearTotal = 0;
            int monthsWithExpense = 0;

            // 월별 지출 표시
            for (int i = 0; i < yearly.size(); i++) {
                long amount = yearly.get(i);
                if (amount > 0) {
                    result.append(String.format("%2d월: %,10d원\n", i + 1, amount));
                    yearTotal += amount;
                    monthsWithExpense++;
                }
            }

            // 통계 요약
            result.append("\n**연간 요약**\n");
            result.append(String.format("- 연간 총 지출: %,d원\n", yearTotal));
            result.append(String.format("- 지출이 있는 월: %d개월\n", monthsWithExpense));

            if (monthsWithExpense > 0) {
                long avgPerMonth = yearTotal / monthsWithExpense;
                result.append(String.format("- 월 평균 지출: %,d원\n", avgPerMonth));

                // 최대/최소 월 찾기
                long maxAmount = yearly.stream().mapToLong(Long::longValue).max().orElse(0);
                long minAmount = yearly.stream().filter(v -> v > 0).mapToLong(Long::longValue).min().orElse(0);

                for (int i = 0; i < yearly.size(); i++) {
                    if (yearly.get(i) == maxAmount) {
                        result.append(String.format("- 최대 지출 월: %d월 (%,d원)\n", i + 1, maxAmount));
                        break;
                    }
                }

                if (minAmount > 0) {
                    for (int i = 0; i < yearly.size(); i++) {
                        if (yearly.get(i) == minAmount && yearly.get(i) > 0) {
                            result.append(String.format("- 최소 지출 월: %d월 (%,d원)\n", i + 1, minAmount));
                            break;
                        }
                    }
                }
            }

            return result.toString().trim();

        } catch (Exception e) {
            return "❌ 연간 트렌드 분석 실패: " + e.getMessage();
        }
    }

    // --- Helper Methods ---

    private Long getUserIdFromContext(ToolContext context) {
        Long userId = (Long) context.getContext().get("currentUserId");
        if (userId == null) throw new IllegalStateException("로그인 정보 없음");
        return userId;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String formatCategoryStats(MonthlyStatisticsResponseDto stats, int year, int month) {
        if (stats.totalExpenseCount() == 0) {
            return String.format("📊 %d년 %d월에는 카테고리별 지출 데이터가 없습니다.", year, month);
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("📊 **%d년 %d월 카테고리별 통계**\n\n", year, month));
        sb.append(String.format("💰 총 지출: %,d원 (%d건)\n",
                stats.totalExpenseAmount(), stats.totalExpenseCount()));

        // 최대 지출
        if (stats.topExpense() != null) {
            TopExpenseDto topExpense = stats.topExpense();
            sb.append(String.format("🔝 최대 지출: %s (%,d원)\n\n",
                    topExpense.title(), topExpense.amount()));
        }

        // 카테고리별 지출
        if (!stats.categories().isEmpty()) {
            sb.append("📂 **카테고리별 지출**\n");
            for (CategorySummaryDto category : stats.categories()) {
                double percentage = (category.totalAmount() * 100.0) / stats.totalExpenseAmount();
                sb.append(String.format("  • %s: %,d원 (%.1f%%)\n",
                        category.tagName(), category.totalAmount(), percentage));
            }
        }

        // 미정산 정보
        if (stats.notCompletedSettlementCount() > 0) {
            sb.append(String.format("\n⚠️ 미정산 건수: %d건 / 전체 정산 %d건\n",
                    stats.notCompletedSettlementCount(), stats.totalSettlementCount()));
        }

        return sb.toString();
    }
}