package com.jeongchongmu.statistics;

import com.jeongchongmu.statistics.dto.MonthlyStatisticsResponseDto;
import com.jeongchongmu.user.User;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class StatisticsController {
    private final StatisticsService statisticsService;

    /**
     * 사용자별 그룹 월간 통계 조회 API
     *
     * @param groupId 그룹 ID
     * @param year 연도
     * @param month 월
     * @param user 인증된 사용자 (Spring Security에서 자동 주입)
     * @return 사용자별 월간 통계 데이터
     */
    @GetMapping("/api/groups/{groupId}/statistics")
    public ResponseEntity<MonthlyStatisticsResponseDto> getMonthlyStatistics(
            @PathVariable("groupId") Long groupId,
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @AuthenticationPrincipal User user
    ){
        MonthlyStatisticsResponseDto monthlyStatisticsResponseDto =
                statisticsService.getMonthlyStatistics(groupId, year, month, user.getId());
        return ResponseEntity.ok(monthlyStatisticsResponseDto);
    }

    /**
     * 개인 전체 월간 통계 조회 API (모든 그룹 합산)
     *
     * @param year 연도
     * @param month 월
     * @param user 인증된 사용자 (Spring Security에서 자동 주입)
     * @return 개인 전체 월간 통계 데이터
     */
    @GetMapping("/api/statistics")
    public ResponseEntity<MonthlyStatisticsResponseDto> getUserTotalStatistics(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @AuthenticationPrincipal User user
    ){
        MonthlyStatisticsResponseDto monthlyStatisticsResponseDto =
                statisticsService.getUserTotalStatistics(year, month, user.getId());
        return ResponseEntity.ok(monthlyStatisticsResponseDto);
    }
}