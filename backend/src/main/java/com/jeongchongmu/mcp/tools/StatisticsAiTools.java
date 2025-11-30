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
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StatisticsAiTools {

    private final StatisticsService statisticsService;
    private final UserRepository userRepository;

    // =================================================================================
    // 🔥 수정된 카테고리 분석 메서드
    // =================================================================================

    @Tool(description = """
        그룹의 카테고리별 지출 통계를 분석합니다.
        
        ⚠️ 중요: year와 month를 모두 생략하면 전체 기간 통계를 조회합니다.
        - 전체 기간 조회: getCategoryAnalysis(groupId=101)
        - 특정 월 조회: getCategoryAnalysis(groupId=101, year=2024, month=11)
        """)
    public String getCategoryAnalysis(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "연도 (생략 시 전체 기간)", required = false) Integer year,
            @ToolParam(description = "월 (생략 시 전체 기간)", required = false) Integer month,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);
        try {
            User user = getUser(userId);

            // 🔥 핵심 수정: null을 그대로 전달!
            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(
                    groupId, year, month  // ← null이면 null로 전달
            );

            // 전체 기간인지 특정 월인지 구분하여 포맷
            boolean isAllTime = (year == null && month == null);

            if (isAllTime) {
                return formatAllTimeCategoryStats(stats);
            } else {
                int targetYear = (year != null) ? year : LocalDate.now().getYear();
                int targetMonth = (month != null) ? month : LocalDate.now().getMonthValue();
                return formatCategoryStats(stats, targetYear, targetMonth);
            }

        } catch (Exception e) {
            log.error("Category Analysis Error", e);
            return "❌ 통계 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 🆕 전체 기간 통계 포맷 메서드
    // =================================================================================

    private String formatAllTimeCategoryStats(MonthlyStatisticsResponseDto stats) {
        if (stats.totalExpenseCount() == 0) {
            return "📊 전체 기간 동안 카테고리별 지출 데이터가 없습니다.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("📊 **전체 기간 카테고리별 통계**\n\n");
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

    // 기존 formatCategoryStats 메서드는 그대로 유지
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

    // --- 나머지 메서드들도 동일한 방식으로 수정 필요 ---

    @Tool(description = "특정 그룹의 월별 지출 및 정산 통계를 종합적으로 조회합니다.")
    public String getMonthlyStatistics(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "조회할 연도 (생략 시 전체 기간)", required = false) Integer year,
            @ToolParam(description = "조회할 월 (생략 시 전체 기간)", required = false) Integer month
    ) {
        try {
            // 🔥 수정: null을 그대로 전달
            MonthlyStatisticsResponseDto stats = statisticsService.getMonthlyStatistics(
                    groupId, year, month
            );

            boolean isAllTime = (year == null && month == null);

            StringBuilder result = new StringBuilder();
            if (isAllTime) {
                result.append("📊 전체 기간 통계\n\n");
            } else {
                int targetYear = (year != null) ? year : LocalDate.now().getYear();
                int targetMonth = (month != null) ? month : LocalDate.now().getMonthValue();
                result.append(String.format("📊 %d년 %d월 통계\n\n", targetYear, targetMonth));
            }

            // 나머지 로직은 동일...
            result.append("💰 **지출 현황**\n");
            result.append(String.format("- 총 지출액: %,d원\n", stats.totalExpenseAmount()));
            result.append(String.format("- 지출 건수: %d건\n\n", stats.totalExpenseCount()));

            // ... (이하 기존 코드 유지)

            return result.toString().trim();

        } catch (Exception e) {
            return "❌ 통계 조회 실패: " + e.getMessage();
        }
    }

    // Helper methods는 그대로 유지
    private Long getUserIdFromContext(ToolContext context) {
        Long userId = (Long) context.getContext().get("currentUserId");
        if (userId == null) throw new IllegalStateException("로그인 정보 없음");
        return userId;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}