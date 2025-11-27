package com.jeongchongmu.vote.repository;

import com.jeongchongmu.vote.entity.VoteOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VoteOptionRepository extends JpaRepository<VoteOption, Long> {

    @Query("SELECT vo FROM VoteOption vo " +
            "JOIN FETCH vo.vote v " +
            "JOIN FETCH v.expense e " +
            "JOIN FETCH e.group " +
            "WHERE vo.id = :optionId")
    Optional<VoteOption> findByIdWithVoteAndExpense(@Param("optionId") Long optionId);
}