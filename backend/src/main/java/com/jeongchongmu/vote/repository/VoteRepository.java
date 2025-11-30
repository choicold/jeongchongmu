package com.jeongchongmu.vote.repository;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.vote.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByExpense(Expense expense);

    // [추가] 특정 그룹 리스트에 속한 지출 중, 마감되지 않은 투표 목록 조회
    List<Vote> findByExpense_Group_IdInAndIsClosedFalse(List<Long> groupIds);
}