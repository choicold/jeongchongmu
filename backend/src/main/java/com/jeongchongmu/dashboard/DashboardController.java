package com.jeongchongmu.dashboard;

import com.jeongchongmu.dashboard.dto.DashboardResponseDto;
import com.jeongchongmu.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 대시보드 컨트롤러
 * 메인 화면에 필요한 모든 데이터를 한 번에 제공하는 API
 */
@RestController
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    /**
     * 대시보드 데이터 조회
     *
     * @param user 인증된 사용자 (Spring Security에서 자동 주입)
     * @return 대시보드 응답 (그룹 목록, 이번 달 지출, 최근 활동, 정산 현황)
     */
    @GetMapping("/api/dashboard")
    public ResponseEntity<DashboardResponseDto> getDashboard(
            @AuthenticationPrincipal User user
    ) {
        DashboardResponseDto dashboard = dashboardService.getDashboard(user.getId());
        return ResponseEntity.ok(dashboard);
    }
}
