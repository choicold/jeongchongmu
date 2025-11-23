package com.jeongchongmu.vote.service;

import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.JPA.ExpenseItem;
import com.jeongchongmu.expense.repository.ExpenseRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import com.jeongchongmu.vote.dto.CastVoteRequest;
import com.jeongchongmu.vote.dto.VoteResponse;
import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.vote.repository.UserVoteRepository;
import com.jeongchongmu.vote.repository.VoteOptionRepository;
import com.jeongchongmu.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VoteService {

    private final VoteRepository voteRepository;
    private final VoteOptionRepository voteOptionRepository;
    private final UserVoteRepository userVoteRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    // 1. 투표 생성 (지출이 등록되면 호출하거나, 별도로 호출)
    public Long createVote(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 없음"));

        if (voteRepository.findByExpense(expense).isPresent()) {
            throw new IllegalStateException("이미 투표가 생성되었습니다.");
        }

        Vote vote = Vote.builder().expense(expense).build();
        voteRepository.save(vote);

        // 지출 항목들을 투표 선택지로 변환
        for (ExpenseItem item : expense.getItems()) {
            VoteOption option = VoteOption.builder()
                    .vote(vote)
                    .expenseItem(item)
                    .build();
            voteOptionRepository.save(option);
        }
        return vote.getId();
    }

    // 2. 투표 하기 / 취소 하기 (토글)
    public void castVote(CastVoteRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("유저 없음"));
        VoteOption option = voteOptionRepository.findById(request.getOptionId())
                .orElseThrow(() -> new IllegalArgumentException("옵션 없음"));

        if (userVoteRepository.existsByUserAndVoteOption(user, option)) {
            userVoteRepository.deleteByUserAndVoteOption(user, option); // 이미 했으면 취소
        } else {
            UserVote userVote = UserVote.builder().user(user).voteOption(option).build();
            userVoteRepository.save(userVote);
        }
    }

    // 3. 투표 현황 조회
    @Transactional(readOnly = true)
    public VoteResponse getVoteStatus(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 없음"));
        Vote vote = voteRepository.findByExpense(expense)
                .orElseThrow(() -> new IllegalArgumentException("투표가 아직 생성되지 않았습니다."));

        // 모든 투표 내역 가져오기 (성능 최적화는 나중에 fetch join으로)
        List<UserVote> allVotes = userVoteRepository.findAll();

        return VoteResponse.from(vote, allVotes);
    }
}