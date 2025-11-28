package com.jeongchongmu.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * FCM 토큰 등록/업데이트 요청 DTO
 *
 * @author Jeongchongmu Team
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FcmTokenRequestDto {

    /**
     * Firebase Cloud Messaging 토큰
     * 앱에서 생성된 FCM 토큰을 전달합니다.
     */
    @NotBlank(message = "FCM 토큰은 필수입니다.")
    private String fcmToken;
}
