package com.jeongchongmu.expense.Repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.expense.JPA.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    //저장, 삭제는 상속 받은거 쓰면 됨
    //.save(), .deleteById(id), .delete(expense) 등등

    //그룹별 정산조회
    List<Expense> findByGroup(Group group);

    //특정 정산 + item + 참여인원 조회
    @Query("SELECT e FROM Expense e " +
            "LEFT JOIN FETCH e.items " +
            "LEFT JOIN FETCH e.participants p " +
            "LEFT JOIN FETCH p.user " + // 참여자의 상세 User 정보까지 한 번에 가져옵니다.
            "WHERE e.id = :expenseId")
    Optional<Expense> findByIdWithDetails(@Param("expenseId")Long expenseId);
}
