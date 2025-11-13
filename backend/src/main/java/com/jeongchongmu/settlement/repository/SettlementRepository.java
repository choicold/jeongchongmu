package com.jeongchongmu.settlement.repository;

import com.jeongchongmu.settlement.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepository<관리할 엔티티, 엔티티의 ID 타입>
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    //
    // save(), findById(), delete() 등은 JpaRepository가
    // 기본으로 제공하므로 아무것도 적지 않아도 됩니다.
    //

    // (선택사항) 나중에 특정 지출(Expense) ID로 정산(Settlement)을
    // 찾아야 할 수도 있으므로, 아래 메서드를 추가해두면 유용합니다.
    // Optional<Settlement> findByExpenseId(Long expenseId);
}