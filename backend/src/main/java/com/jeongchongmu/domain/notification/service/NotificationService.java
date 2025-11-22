package com.jeongchongmu.domain.notification.service;

import com.jeongchongmu.domain.notification.dto.NotificationDto;
import com.jeongchongmu.domain.notification.entity.Notification;
import com.jeongchongmu.domain.notification.entity.NotificationType;
import com.jeongchongmu.domain.notification.repository.NotificationRepository;
import com.jeongchongmu.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/*
 * NotificationService가 제공하는 기능
 * 1. 알림 생성 및 발송
 * 2. 알림 읽음 처리
 * 3. 알림 조회
 */

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final ExpoPushService expoPushService;

    // 알림 생성 및 발송(DB 저장 + Expo로 push)
    @Transactional
    public void send(User recipient, NotificationType type, String content, Long relatedId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .content(content)
                .relatedId(relatedId)
                .build();

        notificationRepository.save(notification);

        String title = type.getTitle();

        expoPushService.send(recipient.getFcmToken(), title, content, relatedId);
    }

    @Transactional
    public void updateIsRead(Long notificationId, Long currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림이 존재하지 않습니다."));

        if (!notification.getRecipient().getId().equals(currentUserId)) {
            throw new IllegalStateException("알림을 읽을 권한이 없습니다.");
        }

        notification.updateIsRead();
    }

    public List<NotificationDto> getMyNotifications(Long userId) {
        List<Notification> notifications =
                notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(userId);

        return notifications.stream()
                .map(NotificationDto::from)
                .toList();
    }
}
