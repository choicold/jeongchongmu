package com.jeongchongmu.vote.repository;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.vote.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByExpense(Expense expense);

    boolean existsByExpense(Expense expense);

    /**
     * N+1 방지용 Fetch Join
     */
    @Query("SELECT DISTINCT v FROM Vote v " +
            "LEFT JOIN FETCH v.options o " +
            "LEFT JOIN FETCH o.expenseItem " +
            "WHERE v.expense = :expense")
    Optional<Vote> findByExpenseWithOptionsAndVotes(@Param("expense") Expense expense);

    /**
     * 마감 시간이 지난 투표 조회 (스케줄러용)
     */
    @Query("SELECT v FROM Vote v WHERE v.closeAt < :now")
    List<Vote> findClosedVotes(@Param("now") LocalDateTime now);
}