package com.jeongchongmu.expense.Repository;

import com.jeongchongmu.expense.JPA.ExpenseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseItemRepository extends JpaRepository<ExpenseItem, Long> {
    // JpaRepository의 기본 메서드(save, findById, delete 등)로 충분합니다.
    // 'Expense'에 종속되어 있어 단독으로 조회할 일이 거의 없습니다.
}