package com.jeongchongmu.domain.notification.dto;

import com.jeongchongmu.domain.notification.entity.Notification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,                // 알림 id
        String type,            // 알림 유형
        String content,         // 알림 메시지
        Long relatedId,         // 알림을 보낼 user id
        boolean isRead,         // 알림 읽음 여부
        LocalDateTime createdAt // 알림 보낸 시간
) {
    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType().name(),
                notification.getContent(),
                notification.getRelatedId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
