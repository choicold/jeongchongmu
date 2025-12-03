package com.jeongchongmu.dashboard.dto;

import com.jeongchongmu.domain.group.dto.GroupDto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 대시보드 응답 DTO
 * 메인 화면에 필요한 모든 데이터를 한 번에 제공합니다.
 */
@Getter
@Builder
public class DashboardResponseDto {
    /**
     * 사용자가 속한 그룹 목록 (최대 5개)
     */
    private List<GroupDto> groups;

    /**
     * 이번 달 총 지출 금액 (모든 그룹 합산)
     */
    private Long thisMonthExpense;

    /**
     * 최근 활동 목록 (최대 5개)
     */
    private List<RecentActivityDto> recentActivities;

    /**
     * 받을 돈
     */
    private Long toReceive;

    /**
     * 보낼 돈
     */
    private Long toSend;
}
