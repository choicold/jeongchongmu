package com.jeongchongmu.expense.Repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.statistics.dto.CategorySummaryDto;
import com.jeongchongmu.statistics.dto.ExpenseSummaryDto;
import com.jeongchongmu.statistics.dto.MonthlyExpenseStatDto;
import com.jeongchongmu.statistics.dto.TopExpenseDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

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




    // 1. 월간 지출 요약 (총액, 횟수, 최대금액)
    @Query("SELECT new com.jeongchongmu.statistics.dto.ExpenseSummaryDto(" +
            "SUM(e.amount), COUNT(e), MAX(e.amount)) " +
            "FROM Expense e " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month")
    ExpenseSummaryDto findMonthlyExpenseSummary(@Param("groupId") Long groupId,
                                                @Param("year") int year,
                                                @Param("month") int month);


    // 2. 카테고리(태그)별 지출 통계
    @Query("SELECT new com.jeongchongmu.statistics.dto.CategorySummaryDto(" +
            "t.name, SUM(e.amount)) " +
            "FROM Expense e " +
            "JOIN e.tags t " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month " +
            "GROUP BY t.name")
    List<CategorySummaryDto> findMonthlyCategoryStatistics(@Param("groupId") Long groupId,
                                                           @Param("year") int year,
                                                           @Param("month") int month);


    // 3. 가장 금액이 큰 지출 1건 상세 정보
    @Query("SELECT new com.jeongchongmu.statistics.dto.TopExpenseDto(" +
            "e.id, e.title, e.amount) " +
            "FROM Expense e " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month " +
            "ORDER BY e.amount DESC")
    List<TopExpenseDto> findTopExpense(@Param("groupId") Long groupId,
                                       @Param("year") int year,
                                       @Param("month") int month,
                                       Pageable pageable);

    // 4. 연간 월별 합계
    @Query("SELECT new com.jeongchongmu.statistics.dto.MonthlyExpenseStatDto(" +
            "MONTH(e.expenseData), SUM(e.amount)) " +
            "FROM Expense e " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "GROUP BY MONTH(e.expenseData)")
    List<MonthlyExpenseStatDto> findYearlyStatistics(@Param("groupId") Long groupId,
                                                     @Param("year") int year);
}
