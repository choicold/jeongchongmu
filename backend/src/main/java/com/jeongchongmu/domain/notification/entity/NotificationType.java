package com.jeongchongmu.domain.notification.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 푸시 알림 타입 Enum
 *
 * 각 비즈니스 로직에서 발생하는 알림의 종류를 정의합니다.
 *
 * @author Jeongchongmu Team
 */
@Getter
@RequiredArgsConstructor
public enum NotificationType {
    /**
     * 정산 생성 시 알림
     * - 대상: 정산에 포함된 참여자들 (본인 제외)
     * - 내용: "{지출자}님이 정산을 요청했습니다. 확인 후 송금해주세요."
     * - 이동: 정산 상세 페이지
     */
    SETTLEMENT_REQUEST("📣 정산 요청"),

    /**
     * 정산 완료 알림
     * - 조건: 모든 참여자가 송금을 완료했을 때
     * - 대상: 모든 참여자
     * - 내용: "모든 정산이 완료되었습니다!"
     * - 이동: 정산 완료 내역 페이지
     */
    SETTLEMENT_COMPLETED("✅ 정산 완료"),

    /**
     * 미정산 리마인더 알림
     * - 대상: 아직 송금하지 않은 참여자
     * - 내용: "아직 정산하지 않은 내역이 있습니다."
     */
    SETTLEMENT_REMINDER("🙇🏻 미정산 요청"),

    /**
     * 항목별 정산 투표 생성 시 알림
     * - 대상: 해당 정산 참여자들
     * - 내용: "항목별 정산 투표가 시작되었습니다. 본인이 먹은 메뉴를 선택해주세요."
     * - 이동: 투표 페이지
     */
    VOTE_CREATED("🗳️ 정산 내역 투표"),

    /**
     * 투표 완료 시 알림
     * - 조건: 모든 참여자가 투표를 마쳤을 때
     * - 대상: 정산 생성자(지출자)
     * - 내용: "모든 참여자가 투표를 완료했습니다. 정산 결과를 확인하세요."
     * - 이동: 정산 결과 페이지
     */
    VOTE_COMPLETED("✅ 투표 완료"),

    /**
     * 투표 마감 알림 (수동 마감)
     * - 대상: 참여자들
     * - 내용: "투표가 마감되었습니다."
     */
    VOTE_CLOSE("🔒 투표 마감"),

    /**
     * 지출 추가 알림
     * - 대상: 그룹 멤버들
     * - 내용: "{사용자}님이 새로운 지출을 등록했습니다."
     */
    EXPENSE_ADDED("💳 지출 등록 완료"),

    /**
     * 그룹 초대 알림
     * - 대상: 그룹에 초대된 사용자
     * - 내용: "{그룹명}에 초대되었습니다."
     */
    GROUP_INVITE("👋 그룹 초대 완료");

    private final String title;
}
