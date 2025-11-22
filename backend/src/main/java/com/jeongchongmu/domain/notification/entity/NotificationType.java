package com.jeongchongmu.domain.notification.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {
    SETTLEMENT_REQUEST("📣 정산 요청"),      // 정산 요청
    SETTLEMENT_REMINDER("🙇🏻 미정산 요청"),    // 미정산 요청
    VOTE_CREATED("🗳️ 정산 내역 투표"),        // 투표 생성
    VOTE_CLOSE("✅ 투표 마감"),              // 투표 마감
    EXPENSE_ADDED("💳 지출 등록 완료"),       // 지출 추가
    GROUP_INVITE("👋 그룹 초대 완료");        // 그룹 합류 시 당사자에게만 알림

    private final String title;
}
