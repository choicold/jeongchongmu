package com.jeongchongmu.mcp.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Component
public class DateTimeAiTools {

    // =================================================================================
    // 1. 현재 날짜 및 시간 조회
    // =================================================================================

    @Tool(description = "현재 날짜와 시간을 조회합니다. 오늘 날짜, 현재 시각, 요일 정보를 제공합니다.")
    public String getCurrentDateTime() {
        LocalDateTime now = LocalDateTime.now();

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy년 M월 d일 (E)");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH시 mm분 ss초");

        return String.format(
                "📅 **현재 날짜 및 시간**\n" +
                        "- 날짜: %s\n" +
                        "- 시간: %s",
                now.format(dateFormatter),
                now.format(timeFormatter)
        );
    }

    @Tool(description = "오늘 날짜만 조회합니다. YYYY-MM-DD 형식으로 반환합니다.")
    public String getToday() {
        LocalDate today = LocalDate.now();
        return String.format("📅 오늘은 %s입니다.", today.format(DateTimeFormatter.ofPattern("yyyy년 M월 d일 (E)")));
    }

    @Tool(description = "현재 시각만 조회합니다. HH:MM:SS 형식으로 반환합니다.")
    public String getCurrentTime() {
        LocalDateTime now = LocalDateTime.now();
        return String.format("🕐 현재 시각은 %s입니다.", now.format(DateTimeFormatter.ofPattern("HH시 mm분 ss초")));
    }

    // =================================================================================
    // 2. 날짜 계산
    // =================================================================================

    @Tool(description = "오늘부터 N일 후의 날짜를 계산합니다. 양수는 미래, 음수는 과거입니다.")
    public String getDateAfterDays(
            @org.springframework.ai.tool.annotation.ToolParam(description = "계산할 일수 (예: 7, -3)") int days
    ) {
        LocalDate result = LocalDate.now().plusDays(days);
        String direction = days > 0 ? "후" : "전";

        return String.format(
                "📅 오늘부터 %d일 %s는 %s입니다.",
                Math.abs(days),
                direction,
                result.format(DateTimeFormatter.ofPattern("yyyy년 M월 d일 (E)"))
        );
    }

    @Tool(description = "두 날짜 사이의 일수를 계산합니다.")
    public String getDaysBetween(
            @org.springframework.ai.tool.annotation.ToolParam(description = "시작 날짜 (YYYY-MM-DD 형식)") String startDate,
            @org.springframework.ai.tool.annotation.ToolParam(description = "종료 날짜 (YYYY-MM-DD 형식)") String endDate
    ) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            long days = ChronoUnit.DAYS.between(start, end);

            return String.format(
                    "📅 %s부터 %s까지 %d일입니다.",
                    start.format(DateTimeFormatter.ofPattern("yyyy년 M월 d일")),
                    end.format(DateTimeFormatter.ofPattern("yyyy년 M월 d일")),
                    Math.abs(days)
            );
        } catch (Exception e) {
            return "❌ 날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요. (예: 2024-11-27)";
        }
    }

    // =================================================================================
    // 3. 이번 달 정보
    // =================================================================================

    @Tool(description = "이번 달의 시작일과 종료일, 총 일수를 조회합니다.")
    public String getCurrentMonthInfo() {
        LocalDate today = LocalDate.now();
        LocalDate firstDay = today.withDayOfMonth(1);
        LocalDate lastDay = today.withDayOfMonth(today.lengthOfMonth());

        return String.format(
                "📅 **%d년 %d월 정보**\n" +
                        "- 시작일: %s\n" +
                        "- 종료일: %s\n" +
                        "- 총 일수: %d일\n" +
                        "- 오늘: %d일차",
                today.getYear(),
                today.getMonthValue(),
                firstDay.format(DateTimeFormatter.ofPattern("M월 d일 (E)")),
                lastDay.format(DateTimeFormatter.ofPattern("M월 d일 (E)")),
                today.lengthOfMonth(),
                today.getDayOfMonth()
        );
    }

    @Tool(description = "이번 달의 남은 일수를 계산합니다.")
    public String getRemainingDaysInMonth() {
        LocalDate today = LocalDate.now();
        LocalDate lastDay = today.withDayOfMonth(today.lengthOfMonth());
        long remainingDays = ChronoUnit.DAYS.between(today, lastDay);

        return String.format(
                "📅 이번 달(%d년 %d월)은 %d일 남았습니다.",
                today.getYear(),
                today.getMonthValue(),
                remainingDays
        );
    }

    // =================================================================================
    // 4. 특정 연도/월 정보
    // =================================================================================

    @Tool(description = "특정 연도와 월의 시작일, 종료일, 총 일수를 조회합니다.")
    public String getMonthInfo(
            @org.springframework.ai.tool.annotation.ToolParam(description = "연도 (예: 2024)") int year,
            @org.springframework.ai.tool.annotation.ToolParam(description = "월 (1~12)") int month
    ) {
        try {
            LocalDate date = LocalDate.of(year, month, 1);
            LocalDate lastDay = date.withDayOfMonth(date.lengthOfMonth());

            return String.format(
                    "📅 **%d년 %d월 정보**\n" +
                            "- 시작일: %s\n" +
                            "- 종료일: %s\n" +
                            "- 총 일수: %d일",
                    year,
                    month,
                    date.format(DateTimeFormatter.ofPattern("M월 d일 (E)")),
                    lastDay.format(DateTimeFormatter.ofPattern("M월 d일 (E)")),
                    date.lengthOfMonth()
            );
        } catch (Exception e) {
            return "❌ 올바르지 않은 날짜입니다. 연도는 양수, 월은 1~12 사이여야 합니다.";
        }
    }

    // =================================================================================
    // 5. 요일 정보
    // =================================================================================

    @Tool(description = "특정 날짜의 요일을 조회합니다.")
    public String getDayOfWeek(
            @org.springframework.ai.tool.annotation.ToolParam(description = "날짜 (YYYY-MM-DD 형식)") String date
    ) {
        try {
            LocalDate targetDate = LocalDate.parse(date);
            return String.format(
                    "📅 %s는 %s입니다.",
                    targetDate.format(DateTimeFormatter.ofPattern("yyyy년 M월 d일")),
                    targetDate.format(DateTimeFormatter.ofPattern("E요일"))
            );
        } catch (Exception e) {
            return "❌ 날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요. (예: 2024-11-27)";
        }
    }
}