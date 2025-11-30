package com.jeongchongmu.domain.notification.entity;

import com.jeongchongmu.common.BaseEntity;
import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="notifications")
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private Long relatedId;

    @Column(nullable = false)
    private boolean isRead;

    @Builder
    public Notification(User recipient, NotificationType type, String content, Long relatedId) {
        this.recipient = recipient;
        this.type = type;
        this.content = content;
        this.relatedId = relatedId;
        this.isRead = false; // 생성 시엔 안 읽음 상태
    }

    public void updateIsRead() { // updated_at이 바뀌면 그게 알림을 읽은 시간이 됨
        if (!this.isRead) {
            this.isRead = true;
        }
    }
}
