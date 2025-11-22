package com.jeongchongmu.domain.notification.controller;


import com.jeongchongmu.domain.notification.dto.NotificationDto;
import com.jeongchongmu.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    // 알림 목록 조회
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(
            @RequestAttribute("userId") Long userId
    ) {
        List<NotificationDto> response = notificationService.getMyNotifications(userId);

        return ResponseEntity.ok(response);
    }

    // 알림 읽음 처리
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> readNotification(
            @PathVariable Long notificationId,
            @RequestAttribute("userId") Long userId
    ) {
        notificationService.updateIsRead(notificationId, userId);
        return ResponseEntity.ok().build();
    }
}
