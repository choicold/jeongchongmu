package com.jeongchongmu.expense.JPA;

import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "expense_participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExpenseParticipant {

    @EmbeddedId
    private ExpenseParticipantId id;

    // ID 클래스의 'expenseId' 필드를 실제 Expense 엔티티와 매핑합니다.
    @MapsId("expenseId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id")
    private Expense expense;

    // ID 클래스의 'userId' 필드를 실제 User 엔티티와 매핑합니다.
    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 생성자 (편의상 추가)
    public ExpenseParticipant(Expense expense, User user) {
        this.id = new ExpenseParticipantId(expense.getId(), user.getId());
        this.expense = expense;
        this.user = user;
    }
}