package com.jeongchongmu.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 최근 활동 DTO
 * 지출 정보와 정산 정보를 함께 제공합니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDto {
    /**
     * 지출 ID
     */
    private Long expenseId;

    /**
     * 그룹 ID
     */
    private Long groupId;

    /**
     * 지출 제목
     */
    private String title;

    /**
     * 지출 금액
     */
    private Long amount;

    /**
     * 결제자 이름
     */
    private String payerName;

    /**
     * 지출 일시
     */
    private LocalDateTime expenseDate;

    /**
     * 정산 ID (정산이 없으면 null)
     */
    private Long settlementId;

    /**
     * 정산 상태 (PENDING, COMPLETED, null)
     */
    private String settlementStatus;

    /**
     * 참여자 목록
     */
    private java.util.List<String> participants;
}
