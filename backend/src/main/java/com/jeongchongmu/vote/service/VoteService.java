package com.jeongchongmu.vote.service;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.JPA.ExpenseItem;
import com.jeongchongmu.domain.expense.JPA.ExpenseParticipant;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.domain.notification.entity.NotificationType;
import com.jeongchongmu.domain.notification.service.NotificationService;
import com.jeongchongmu.settlement.repository.SettlementRepository;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VoteService {

    private final VoteRepository voteRepository;
    private final VoteOptionRepository voteOptionRepository;
    private final UserVoteRepository userVoteRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final NotificationService notificationService;
    private final SettlementRepository settlementRepository;

    // 1. 투표 생성 (수정됨)
    public Long createVote(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 없음"));

        // 정산이 존재하면 투표를 시작할 수 없음 (순서: 투표 -> 정산)
        if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
            throw new IllegalStateException("이미 정산(청구서)이 생성된 지출입니다. 투표를 하려면 기존 정산을 삭제해주세요.");
        }

        // 변경: 있으면 해당 Vote의 ID를 바로 반환 (프론트엔드는 성공한 것으로 간주하고 이동 가능)
        var existingVote = voteRepository.findByExpense(expense);
        if (existingVote.isPresent()) {
            return existingVote.get().getId();
        }

        // --- 아래는 기존 생성 로직과 동일 ---
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

        // 푸시 알림 전송 (VOTE_CREATED)
        // 해당 지출의 참여자들에게 알림 전송
        Group group = expense.getGroup();
        List<User> participants = expense.getParticipants().stream()
                .map(ExpenseParticipant::getUser)
                .collect(Collectors.toList());

        notificationService.sendToMultipleUsers(
                participants,
                NotificationType.VOTE_CREATED,
                "항목별 정산 투표가 시작되었습니다. 본인이 먹은 메뉴를 선택해주세요.",
                expenseId
        );

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

        // 투표 완료 여부 확인
        Vote vote = option.getVote();
        Expense expense = vote.getExpense();

        // 참여자 목록 가져오기
        List<User> participants = expense.getParticipants().stream()
                .map(ExpenseParticipant::getUser)
                .collect(Collectors.toList());

        // 모든 참여자가 투표했는지 확인
        boolean allVoted = participants.stream()
                .allMatch(participant -> {
                    // 각 참여자가 최소 1개 이상의 항목에 투표했는지 확인
                    return vote.getOptions().stream()
                            .anyMatch(opt -> userVoteRepository.existsByUserAndVoteOption(participant, opt));
                });

        // 모든 참여자가 투표를 완료했으면 지출자(payer)에게 알림 전송
        if (allVoted) {
            User payer = expense.getPayer();

            notificationService.send(
                    payer,
                    NotificationType.VOTE_COMPLETED,
                    "모든 참여자가 투표를 완료했습니다. 정산 결과를 확인하세요.",
                    expense.getId()
            );
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

    // 4. 투표 삭제 (투표를 다시 진행하고 싶을 때)
    public void deleteVote(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 없음"));
        Vote vote = voteRepository.findByExpense(expense)
                .orElseThrow(() -> new IllegalArgumentException("투표가 존재하지 않습니다."));

        // 투표가 이미 마감되었는지 확인
        if (vote.isClosed()) {
            throw new IllegalStateException("이미 마감된 투표는 삭제할 수 없습니다.");
        }

        // 투표와 관련된 모든 데이터 삭제
        // 1. 먼저 UserVote 삭제
        List<VoteOption> options = voteOptionRepository.findByVote(vote);
        for (VoteOption option : options) {
            userVoteRepository.deleteAllByVoteOption(option);
        }

        // 2. VoteOption 삭제
        voteOptionRepository.deleteAllByVote(vote);

        // 3. Vote 삭제
        voteRepository.delete(vote);
    }
}