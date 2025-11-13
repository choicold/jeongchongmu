package com.jeongchongmu.expense.repository;

import com.jeongchongmu.expense.JPA.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository // 이 어노테이션을 추가해주는 것이 좋습니다.
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // 내용은 비워두세요.
    // save(), findById(), delete() 등은 JpaRepository가
    // 모두 자동으로 제공합니다.

}