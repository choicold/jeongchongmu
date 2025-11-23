package com.jeongchongmu.domain.notification.dto;

import java.util.Map;

public record ExpoPushRequest(
        String token,               // 알림 받는 사람의 fcmToken
        String title,               // 알림 제목
        String body,                // 알림 내용
        String sound,               // 알림 소리
        Map<String, Object> data    // 클릭 시 앱이 참고할 데이터
) {
    public static ExpoPushRequest of(String token, String title, String body, Map<String, Object> data) {
        return new ExpoPushRequest(token, title, body, "default", data);
    }
}
