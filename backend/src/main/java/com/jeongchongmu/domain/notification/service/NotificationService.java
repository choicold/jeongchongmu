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

    /**
     * 알림 생성 및 발송 (DB 저장 + FCM 푸시)
     *
     * @param recipient 알림을 받을 사용자
     * @param type 알림 타입
     * @param content 알림 내용
     * @param relatedId 관련 엔티티 ID (지출, 정산, 투표 등)
     */
    @Transactional
    public void send(User recipient, NotificationType type, String content, Long relatedId) {
        // 1. DB에 알림 저장
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .content(content)
                .relatedId(relatedId)
                .build();

        notificationRepository.save(notification);

        // 2. FCM 푸시 알림 전송 (타입 정보 포함)
        String title = type.getTitle();
        expoPushService.send(recipient.getFcmToken(), title, content, type, relatedId);
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

    /**
     * 여러 사용자에게 동일한 알림 일괄 전송 (DB 저장 + FCM 푸시)
     *
     * @param recipients 알림을 받을 사용자 리스트
     * @param type 알림 타입
     * @param content 알림 내용
     * @param relatedId 관련 엔티티 ID
     * @return 전송에 성공한 사용자 수
     */
    @Transactional
    public int sendToMultipleUsers(List<User> recipients, NotificationType type, String content, Long relatedId) {
        int successCount = 0;

        for (User recipient : recipients) {
            try {
                send(recipient, type, content, relatedId);
                successCount++;
            } catch (Exception e) {
                // 개별 전송 실패 시 로그만 남기고 계속 진행
                System.err.println("알림 전송 실패 - 사용자: " + recipient.getName() + ", 에러: " + e.getMessage());
            }
        }

        return successCount;
    }

    public List<NotificationDto> getMyNotifications(Long userId) {
        List<Notification> notifications =
                notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(userId);

        return notifications.stream()
                .map(NotificationDto::from)
                .toList();
    }
}
