package com.jeongchongmu.domain.expense.Repository;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.JPA.ExpenseParticipant;
import com.jeongchongmu.domain.expense.JPA.ExpenseParticipantId;
import com.jeongchongmu.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseParticipantRepository extends JpaRepository<ExpenseParticipant, ExpenseParticipantId> {

    // 특정 지출(Expense)에 속한 모든 참여자 찾기
    List<ExpenseParticipant> findByExpense(Expense expense);

    // 특정 유저(User)가 참여한 모든 지출 내역 찾기
    List<ExpenseParticipant> findByUser(User user);
}