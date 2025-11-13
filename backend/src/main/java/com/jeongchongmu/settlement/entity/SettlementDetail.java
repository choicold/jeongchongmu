package com.jeongchongmu.settlement.entity;

import com.jeongchongmu.common.BaseEntity;
// '사용자' 엔티티 임포트 (user 패키지 경로 확인!)
import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "settlement_details")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SettlementDetail extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    // 돈을 보내야 하는 사람 (채무자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debtor_id", nullable = false)
    private User debtor;

    // 돈을 받아야 하는 사람 (채권자 - 보통 결제자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creditor_id", nullable = false)
    private User creditor;

    // 보내야 할 금액 (Expense.java와 맞춰 BigDecimal 사용)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    @Builder.Default
    private boolean isSent = false; // 송금 완료 여부

    // 송금 완료 처리 메서드
    public void markAsSent() {
        this.isSent = true;
    }
}