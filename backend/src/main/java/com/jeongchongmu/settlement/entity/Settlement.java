package com.jeongchongmu.settlement.entity;

// 공통 BaseEntity 임포트
import com.jeongchongmu.common.BaseEntity;
// Enum 임포트
import com.jeongchongmu.settlement.enums.SettlementMethod;
import com.jeongchongmu.settlement.enums.SettlementStatus;
// '지출' 엔티티 임포트 (expense 패키지 경로 확인!)
import com.jeongchongmu.expense.JPA.Expense;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "settlements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Settlement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 지출(Expense)과 1:1 관계 매핑
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SettlementMethod method; // 정산 방식 (N빵, 직접, 비율, 항목별)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SettlementStatus status = SettlementStatus.PENDING; // 기본값: 진행 중

    private LocalDateTime deadline; // 정산 마감일

    // 정산 상세 내역 (1:N)
    @OneToMany(mappedBy = "settlement", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SettlementDetail> details = new ArrayList<>();

    // 정산 완료 처리 메서드
    public void complete() {
        this.status = SettlementStatus.COMPLETED;
    }
}