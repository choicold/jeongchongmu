package com.jeongchongmu.vote.repository;

import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserVoteRepository extends JpaRepository<UserVote, Long> {
    List<UserVote> findByVoteOption(VoteOption voteOption);
    void deleteByUserAndVoteOption(User user, VoteOption voteOption); // 투표 취소용
    boolean existsByUserAndVoteOption(User user, VoteOption voteOption);
}