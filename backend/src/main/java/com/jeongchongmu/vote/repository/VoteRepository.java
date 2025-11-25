package com.jeongchongmu.vote.repository;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.vote.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByExpense(Expense expense);
}