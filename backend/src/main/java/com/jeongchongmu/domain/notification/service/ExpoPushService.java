package com.jeongchongmu.domain.notification.service;

import com.jeongchongmu.domain.notification.dto.ExpoPushRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpoPushService {

    // Expo의 푸시 전송 URL
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.create();

    // Expo 알림 전송
    public void send(String token, String title, String content, Long relatedId) {
        if (token == null || !token.startsWith("ExponentPushToken")) {
            log.warn("유효하지 않은 토큰입니다. 전송을 건너뜁니다. token={}", token);
            return;
        }

        Map<String, Object> data = new HashMap<>();
        if (relatedId != null) {
            data.put("relatedId", relatedId);
        }

        ExpoPushRequest request = ExpoPushRequest.of(token, title, content, data);

        try {
            restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();

            log.info("푸시 알림 전송 성공: to={}, title={}", token, title);

        } catch (Exception e) {
            log.error("푸시 알림 전송 실패: {}", e.getMessage());
        }
    }
}
