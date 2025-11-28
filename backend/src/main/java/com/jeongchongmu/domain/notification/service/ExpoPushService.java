package com.jeongchongmu.domain.notification.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import com.jeongchongmu.domain.notification.entity.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Firebase Cloud Messaging (FCM)을 이용한 푸시 알림 전송 서비스
 *
 * ExpoPushService를 FCM 기반으로 전환
 * - DB 저장 기능은 NotificationService에서 처리
 * - 순수 푸시 전송만 담당
 *
 * @author Jeongchongmu Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpoPushService {

    /**
     * FCM을 통한 푸시 알림 전송
     *
     * @param token FCM 토큰
     * @param title 알림 제목
     * @param content 알림 내용
     * @param relatedId 관련 엔티티 ID (지출, 정산, 투표 등)
     */
    public void send(String token, String title, String content, Long relatedId) {
        // Firebase가 초기화되지 않았거나 FCM 토큰이 없으면 전송하지 않음
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("⚠️ Firebase가 초기화되지 않아 알림을 전송하지 않습니다.");
            return;
        }

        if (token == null || token.isEmpty()) {
            log.warn("⚠️ FCM 토큰이 없어 알림을 전송하지 않습니다.");
            return;
        }

        try {
            // 딥링킹을 위한 데이터 페이로드 구성
            Map<String, String> data = new HashMap<>();
            if (relatedId != null) {
                data.put("relatedId", String.valueOf(relatedId));
            }
            data.put("title", title);
            data.put("body", content);

            // FCM 메시지 생성
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(content)
                            .build())
                    .putAllData(data)
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .build())
                            .build())
                    .setApnsConfig(ApnsConfig.builder()
                            .setAps(Aps.builder()
                                    .setSound("default")
                                    .build())
                            .build())
                    .build();

            // 메시지 전송
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("✅ FCM 푸시 알림 전송 성공 - 제목: {}, 응답: {}", title, response);

        } catch (FirebaseMessagingException e) {
            log.error("❌ FCM 알림 전송 실패 - 제목: {}, 에러: {}", title, e.getMessage(), e);

            // FCM 토큰이 유효하지 않은 경우 (삭제된 토큰, 만료된 토큰 등)
            if (e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT
                    || e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                log.warn("⚠️ FCM 토큰이 유효하지 않습니다. 토큰을 삭제해야 합니다.");
                // TODO: 토큰 삭제 로직 추가 (선택사항)
            }

        } catch (Exception e) {
            log.error("❌ 알림 전송 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
        }
    }

    /**
     * FCM을 통한 푸시 알림 전송 (타입 포함)
     *
     * @param token FCM 토큰
     * @param title 알림 제목
     * @param content 알림 내용
     * @param type 알림 타입
     * @param relatedId 관련 엔티티 ID
     */
    public void send(String token, String title, String content, NotificationType type, Long relatedId) {
        // Firebase가 초기화되지 않았거나 FCM 토큰이 없으면 전송하지 않음
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("⚠️ Firebase가 초기화되지 않아 알림을 전송하지 않습니다.");
            return;
        }

        if (token == null || token.isEmpty()) {
            log.warn("⚠️ FCM 토큰이 없어 알림을 전송하지 않습니다.");
            return;
        }

        try {
            // 딥링킹을 위한 데이터 페이로드 구성
            Map<String, String> data = new HashMap<>();
            data.put("type", type.name());
            if (relatedId != null) {
                data.put("relatedId", String.valueOf(relatedId));
            }
            data.put("title", title);
            data.put("body", content);

            // FCM 메시지 생성
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(content)
                            .build())
                    .putAllData(data)
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .build())
                            .build())
                    .setApnsConfig(ApnsConfig.builder()
                            .setAps(Aps.builder()
                                    .setSound("default")
                                    .build())
                            .build())
                    .build();

            // 메시지 전송
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("✅ FCM 푸시 알림 전송 성공 - 타입: {}, 제목: {}, 응답: {}", type.getTitle(), title, response);

        } catch (FirebaseMessagingException e) {
            log.error("❌ FCM 알림 전송 실패 - 타입: {}, 제목: {}, 에러: {}", type.getTitle(), title, e.getMessage(), e);

            // FCM 토큰이 유효하지 않은 경우
            if (e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT
                    || e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                log.warn("⚠️ FCM 토큰이 유효하지 않습니다. 토큰을 삭제해야 합니다.");
            }

        } catch (Exception e) {
            log.error("❌ 알림 전송 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
        }
    }
}
