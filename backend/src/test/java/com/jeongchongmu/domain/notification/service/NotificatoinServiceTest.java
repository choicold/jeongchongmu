package com.jeongchongmu.domain.notification.service;

import com.jeongchongmu.domain.notification.dto.NotificationDto;
import com.jeongchongmu.domain.notification.entity.Notification;
import com.jeongchongmu.domain.notification.entity.NotificationType;
import com.jeongchongmu.domain.notification.repository.NotificationRepository;
import com.jeongchongmu.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @InjectMocks
    private NotificationService notificationService;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ExpoPushService expoPushService;

    @Test
    @DisplayName("알림 전송 시 DB 저장과 푸시 발송이 모두 호출되어야 한다")
    void send_success() {
        // given
        User recipient = User.builder().id(1L).name("김철수").fcmToken("ExponentPushToken[xxx]").build();
        String content = "테스트 알림입니다.";
        Long relatedId = 100L;

        // when
        notificationService.send(recipient, NotificationType.SETTLEMENT_REQUEST, content, relatedId);

        // then
        // 1. DB 저장 메서드가 호출되었는지 검증
        verify(notificationRepository, times(1)).save(any(Notification.class));

        // 2. Expo 푸시 서비스가 호출되었는지 검증 (타입에 맞는 제목이 들어갔는지 확인)
        verify(expoPushService, times(1))
                .send(eq("ExponentPushToken[xxx]"), any(String.class), eq(content), eq(relatedId));
    }

    @Test
    @DisplayName("내 알림 목록을 조회하면 DTO로 변환되어 반환된다")
    void getMyNotifications_success() {
        // given
        Long userId = 1L;
        User user = User.builder().id(userId).build();

        Notification notification1 = Notification.builder()
                .recipient(user)
                .type(NotificationType.SETTLEMENT_REQUEST)
                .content("알림1")
                .relatedId(1L)
                .build(); // isRead = false

        // Repository가 알림 리스트를 반환한다고 가정 (Mocking)
        given(notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(userId))
                .willReturn(List.of(notification1));

        // when
        List<NotificationDto> result = notificationService.getMyNotifications(userId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).content()).isEqualTo("알림1");
        assertThat(result.get(0).isRead()).isFalse();
    }

    @Test
    @DisplayName("알림 읽음 처리 성공")
    void markAsRead_success() {
        // given
        Long notificationId = 10L;
        Long userId = 1L;
        User user = User.builder().id(userId).build();

        Notification notification = Notification.builder()
                .recipient(user) // 주인 설정
                .type(NotificationType.VOTE_CREATED)
                .content("내용")
                .relatedId(1L)
                .build();

        given(notificationRepository.findById(notificationId))
                .willReturn(Optional.of(notification));

        // when
        notificationService.updateIsRead(notificationId, userId);

        // then
        assertThat(notification.isRead()).isTrue(); // 상태가 변경되었는지 확인
    }

    @Test
    @DisplayName("다른 사람의 알림을 읽으려 하면 예외가 발생한다")
    void markAsRead_fail_not_owner() {
        // given
        Long notificationId = 10L;
        Long myId = 1L;
        Long otherId = 2L;

        User otherUser = User.builder().id(otherId).build(); // 알림 주인은 2번

        Notification notification = Notification.builder()
                .recipient(otherUser)
                .type(NotificationType.VOTE_CREATED)
                .content("내용")
                .relatedId(1L)
                .build();

        given(notificationRepository.findById(notificationId))
                .willReturn(Optional.of(notification));

        // when & then
        assertThatThrownBy(() -> notificationService.updateIsRead(notificationId, myId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("알림을 읽을 권한이 없습니다.");
    }
}