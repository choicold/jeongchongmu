package com.jeongchongmu.domain.expense.JPA;

import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;

@Entity
@Table(name = "expense_participants")
@Getter
@Setter
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

    // [필수 2] Set에서 객체를 올바르게 찾기 위해 필수
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExpenseParticipant that = (ExpenseParticipant) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}