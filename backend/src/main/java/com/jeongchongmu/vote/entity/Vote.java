package com.jeongchongmu.vote.entity;

import com.jeongchongmu.common.BaseEntity;
import com.jeongchongmu.domain.expense.JPA.Expense;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "votes",
        indexes = {
                @Index(name = "idx_vote_expense", columnList = "expense_id"),
                @Index(name = "idx_vote_close_at", columnList = "close_at")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Vote extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false, unique = true)
    private Expense expense;

    @Column(name = "close_at", nullable = false)
    private LocalDateTime closeAt;  // 마감 예정 시간

    @OneToMany(mappedBy = "vote", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VoteOption> options = new ArrayList<>();

    /**
     * 투표가 마감되었는지 확인 (시간 기반)
     */
    public boolean isClosed() {
        return LocalDateTime.now().isAfter(closeAt);
    }

    /**
     * 투표 기간 연장
     */
    public void extendCloseAt(LocalDateTime newCloseAt) {
        if (newCloseAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("마감 시간은 현재 시간 이후여야 합니다.");
        }
        this.closeAt = newCloseAt;
    }

    /**
     * 즉시 마감 (마감 시간을 현재로 변경)
     */
    public void closeNow() {
        this.closeAt = LocalDateTime.now();
    }
}