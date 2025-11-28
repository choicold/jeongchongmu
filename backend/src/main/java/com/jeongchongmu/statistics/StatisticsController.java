package com.jeongchongmu.statistics;

import com.jeongchongmu.statistics.dto.MonthlyStatisticsResponseDto;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}")
public class StatisticsController {
    private final StatisticsService statisticsService;

    @GetMapping("/statistics")
    public ResponseEntity<MonthlyStatisticsResponseDto> getMonthlyStatistics(
            @PathVariable("groupId") Long groupId,
            @PathParam("year") int year,
            @RequestParam("month") int month
    ){
        MonthlyStatisticsResponseDto monthlyStatisticsResponseDto = statisticsService.getMonthlyStatistics(groupId, year, month);
        return ResponseEntity.ok(monthlyStatisticsResponseDto);
    }
}