package com.jeongchongmu.domain.notification.repository;

import com.jeongchongmu.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 특정 사용자의 알림 목록 전체를 최신순으로 조회
    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    // 특정 사용자의 안 읽은 알림 개수 조회
    long countByRecipientIdAndIsReadFalse(Long recipientId);
}
