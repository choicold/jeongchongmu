package com.jeongchongmu.vote.repository;

import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface UserVoteRepository extends JpaRepository<UserVote, Long> {

    List<UserVote> findByVoteOption(VoteOption voteOption);

    boolean existsByUserAndVoteOption(User user, VoteOption voteOption);

    @Modifying
    @Query("DELETE FROM UserVote uv WHERE uv.user = :user AND uv.voteOption = :voteOption")
    void deleteByUserAndVoteOption(@Param("user") User user, @Param("voteOption") VoteOption voteOption);

    @Query("SELECT uv FROM UserVote uv " +
            "JOIN FETCH uv.user " +
            "JOIN FETCH uv.voteOption vo " +
            "WHERE vo.vote = :vote")
    List<UserVote> findByVoteOptionVote(@Param("vote") Vote vote);

    /**
     * 특정 투표에서 투표한 사용자 ID 목록 조회
     */
    @Query("SELECT DISTINCT uv.user.id FROM UserVote uv " +
            "WHERE uv.voteOption.vote = :vote")
    Set<Long> findVotedUserIdsByVote(@Param("vote") Vote vote);
}