package com.jeongchongmu.vote.service;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.JPA.ExpenseItem;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.vote.dto.CastVoteRequest;
import com.jeongchongmu.vote.dto.CreateVoteRequest;
import com.jeongchongmu.vote.dto.ExtendVoteRequest;
import com.jeongchongmu.vote.dto.VoteResponse;
import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.vote.exception.*;
import com.jeongchongmu.vote.repository.UserVoteRepository;
import com.jeongchongmu.vote.repository.VoteOptionRepository;
import com.jeongchongmu.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VoteService {

    private static final int DEFAULT_VOTE_DURATION_HOURS = 24;

    private final VoteRepository voteRepository;
    private final VoteOptionRepository voteOptionRepository;
    private final UserVoteRepository userVoteRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final SettlementRepository settlementRepository;

    /**
     * 투표 생성
     */
    public Long createVote(Long expenseId, CreateVoteRequest request, User user) {
        Expense expense = findExpenseOrThrow(expenseId);
        Group group = expense.getGroup();

        // 1. 그룹 멤버인지 확인
        validateGroupMembership(user, group);

        // 2. 이미 투표가 있는지 확인
        if (voteRepository.existsByExpense(expense)) {
            throw new VoteAlreadyExistsException("이미 해당 지출에 대한 투표가 존재합니다.");
        }

        // 3. 마감 시간 설정
        LocalDateTime closeAt;
        if (request != null && request.getCloseAt() != null) {
            closeAt = request.getCloseAt();
            if (closeAt.isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("마감 시간은 현재 시간 이후여야 합니다.");
            }
        } else {
            closeAt = LocalDateTime.now().plusHours(DEFAULT_VOTE_DURATION_HOURS);
        }

        // 4. 투표 생성
        Vote vote = Vote.builder()
                .expense(expense)
                .closeAt(closeAt)
                .build();
        voteRepository.save(vote);

        // 5. 지출 항목들을 투표 선택지로 변환
        for (ExpenseItem item : expense.getItems()) {
            VoteOption option = VoteOption.builder()
                    .vote(vote)
                    .expenseItem(item)
                    .build();
            voteOptionRepository.save(option);
        }

        log.info("투표 생성 완료 - voteId: {}, expenseId: {}, closeAt: {}",
                vote.getId(), expenseId, closeAt);

        return vote.getId();
    }

    /**
     * 투표하기 / 취소하기 (토글)
     */
    public void castVote(CastVoteRequest request, User user) {
        VoteOption option = findVoteOptionOrThrow(request.getOptionId());
        Vote vote = option.getVote();

        // 1. 투표가 마감되었는지 확인
        if (vote.isClosed()) {
            throw new VoteAlreadyClosedException("마감된 투표에는 투표할 수 없습니다.");
        }

        // 2. 그룹 멤버인지 확인
        Group group = vote.getExpense().getGroup();
        validateGroupMembership(user, group);

        // 3. 지출 참여자인지 확인
        validateExpenseParticipant(user, vote.getExpense());

        // 4. 기존 투표 여부 확인 후 토글
        boolean alreadyVoted = userVoteRepository.existsByUserAndVoteOption(user, option);

        if (alreadyVoted) {
            userVoteRepository.deleteByUserAndVoteOption(user, option);
            log.info("투표 취소 - userId: {}, optionId: {}", user.getId(), option.getId());
        } else {
            UserVote userVote = UserVote.builder()
                    .user(user)
                    .voteOption(option)
                    .build();
            userVoteRepository.save(userVote);
            log.info("투표 완료 - userId: {}, optionId: {}", user.getId(), option.getId());
        }
    }

    /**
     * 투표 현황 조회
     */
    @Transactional(readOnly = true)
    public VoteResponse getVoteStatus(Long expenseId, User user) {
        Expense expense = findExpenseOrThrow(expenseId);
        Group group = expense.getGroup();

        // 1. 그룹 멤버인지 확인
        validateGroupMembership(user, group);

        // 2. 투표 조회 (fetch join으로 N+1 방지)
        Vote vote = voteRepository.findByExpenseWithOptionsAndVotes(expense)
                .orElseThrow(() -> new VoteNotFoundException("투표가 아직 생성되지 않았습니다."));

        // 3. 해당 투표의 UserVote만 조회
        List<UserVote> voteUserVotes = userVoteRepository.findByVoteOptionVote(vote);

        return VoteResponse.from(vote, voteUserVotes);
    }

    /**
     * 투표 즉시 마감 (OWNER만)
     */
    public void closeVote(Long expenseId, User user) {
        Expense expense = findExpenseOrThrow(expenseId);
        Vote vote = findVoteByExpenseOrThrow(expense);

        // 1. OWNER 권한 확인
        validateOwnerPermission(user, expense.getGroup());

        // 2. 이미 정산이 시작되었는지 확인
        validateSettlementNotStarted(expense.getId());

        // 3. 즉시 마감
        vote.closeNow();
        log.info("투표 강제 마감 - voteId: {}, closedBy: {}", vote.getId(), user.getId());
    }

    /**
     * 투표 기간 연장 (OWNER만)
     */
    public void extendVote(Long expenseId, ExtendVoteRequest request, User user) {
        Expense expense = findExpenseOrThrow(expenseId);
        Vote vote = findVoteByExpenseOrThrow(expense);

        // 1. OWNER 권한 확인
        validateOwnerPermission(user, expense.getGroup());

        // 2. 이미 정산이 시작되었는지 확인
        validateSettlementNotStarted(expense.getId());

        // 3. 기간 연장
        vote.extendCloseAt(request.getNewCloseAt());
        log.info("투표 기간 연장 - voteId: {}, newCloseAt: {}, extendedBy: {}",
                vote.getId(), request.getNewCloseAt(), user.getId());
    }

    // ========== Private Helper Methods ==========

    private Expense findExpenseOrThrow(Long expenseId) {
        return expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ExpenseNotFoundException("지출을 찾을 수 없습니다. ID: " + expenseId));
    }

    private Vote findVoteByExpenseOrThrow(Expense expense) {
        return voteRepository.findByExpense(expense)
                .orElseThrow(() -> new VoteNotFoundException("투표가 존재하지 않습니다."));
    }

    private VoteOption findVoteOptionOrThrow(Long optionId) {
        return voteOptionRepository.findByIdWithVoteAndExpense(optionId)
                .orElseThrow(() -> new VoteOptionNotFoundException("투표 옵션을 찾을 수 없습니다. ID: " + optionId));
    }

    /**
     * 그룹 멤버인지 확인
     */
    private void validateGroupMembership(User user, Group group) {
        boolean isMember = groupMemberRepository.existsByUserAndGroup(user, group);
        if (!isMember) {
            throw new VoteAccessDeniedException("해당 그룹의 멤버만 접근할 수 있습니다.");
        }
    }

    /**
     * 지출 참여자인지 확인
     */
    private void validateExpenseParticipant(User user, Expense expense) {
        boolean isParticipant = expense.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(user.getId()));
        if (!isParticipant) {
            throw new VoteAccessDeniedException("해당 지출의 참여자만 투표할 수 있습니다.");
        }
    }

    /**
     * OWNER 권한 확인
     */
    private void validateOwnerPermission(User user, Group group) {
        GroupMember groupMember = groupMemberRepository.findByUserAndGroup(user, group)
                .orElseThrow(() -> new VoteAccessDeniedException("해당 그룹의 멤버가 아닙니다."));

        if (groupMember.getRole() != Role.OWNER) {
            throw new VoteAccessDeniedException("그룹 OWNER만 이 작업을 수행할 수 있습니다.");
        }
    }

    /**
     * 정산이 시작되지 않았는지 확인
     */
    private void validateSettlementNotStarted(Long expenseId) {
        if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
            throw new VoteAlreadySettledException("이미 정산이 시작된 투표는 수정할 수 없습니다.");
        }
    }
}