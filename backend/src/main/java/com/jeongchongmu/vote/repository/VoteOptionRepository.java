package com.jeongchongmu.vote.repository;

import com.jeongchongmu.vote.entity.VoteOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteOptionRepository extends JpaRepository<VoteOption, Long> {
}