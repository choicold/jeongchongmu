package com.jeongchongmu.mcp.tools;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import com.jeongchongmu.vote.entity.UserVote;
import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.VoteOption;
import com.jeongchongmu.vote.repository.UserVoteRepository;
import com.jeongchongmu.vote.repository.VoteOptionRepository;
import com.jeongchongmu.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class VoteAiTools {

    private static final int DEFAULT_VOTE_DURATION_HOURS = 24;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final VoteRepository voteRepository;
    private final VoteOptionRepository voteOptionRepository;
    private final UserVoteRepository userVoteRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final SettlementRepository settlementRepository;

    // =================================================================================
    // 1. 투표 생성
    // =================================================================================
    @Tool(description = "지출 내역에 대한 투표를 생성합니다. 그룹 멤버들이 각자 먹은 항목을 선택할 수 있게 됩니다.")
    public String createVote(
            @ToolParam(description = "투표를 생성할 지출 ID") Long expenseId,
            @ToolParam(description = "마감 시간 (형식: yyyy-MM-dd HH:mm, 예: 2025-01-15 18:00). 미입력시 24시간 후 자동 마감", required = false) String closeAt,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);
            Group group = expense.getGroup();

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                return "❌ 해당 그룹의 멤버만 투표를 생성할 수 있습니다.";
            }

            // 이미 투표가 있는지 확인
            if (voteRepository.existsByExpense(expense)) {
                return "⚠️ 이미 해당 지출에 대한 투표가 존재합니다.";
            }

            // 마감 시간 설정
            LocalDateTime closeDateTime;
            if (closeAt != null && !closeAt.isBlank()) {
                try {
                    closeDateTime = LocalDateTime.parse(closeAt, DATE_TIME_FORMATTER);
                    if (closeDateTime.isBefore(LocalDateTime.now())) {
                        return "❌ 마감 시간은 현재 시간 이후여야 합니다.";
                    }
                } catch (DateTimeParseException e) {
                    return "❌ 날짜 형식이 올바르지 않습니다. (형식: yyyy-MM-dd HH:mm)";
                }
            } else {
                closeDateTime = LocalDateTime.now().plusHours(DEFAULT_VOTE_DURATION_HOURS);
            }

            // 투표 생성
            Vote vote = Vote.builder()
                    .expense(expense)
                    .closeAt(closeDateTime)
                    .build();
            voteRepository.save(vote);

            // 지출 항목들을 투표 선택지로 변환
            for (var item : expense.getItems()) {
                VoteOption option = VoteOption.builder()
                        .vote(vote)
                        .expenseItem(item)
                        .build();
                voteOptionRepository.save(option);
            }

            // 참여자 목록
            String participants = expense.getParticipants().stream()
                    .map(p -> p.getUser().getName())
                    .collect(Collectors.joining(", "));

            return String.format("✅ 투표가 생성되었습니다!\n" +
                            "- 지출: %s (%,d원)\n" +
                            "- 마감: %s\n" +
                            "- 항목 수: %d개\n" +
                            "- 참여 대상: %s\n\n" +
                            "💡 참여자들은 본인이 먹은 항목에 투표해주세요!",
                    expense.getTitle(),
                    expense.getAmount(),
                    closeDateTime.format(DATE_TIME_FORMATTER),
                    expense.getItems().size(),
                    participants);

        } catch (Exception e) {
            log.error("투표 생성 실패", e);
            return "❌ 투표 생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 2. 투표하기 (토글)
    // =================================================================================
    @Tool(description = "특정 항목에 투표하거나 투표를 취소합니다. 이미 투표한 항목을 다시 선택하면 취소됩니다.")
    public String castVote(
            @ToolParam(description = "투표할 항목(옵션) ID") Long optionId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            VoteOption option = voteOptionRepository.findByIdWithVoteAndExpense(optionId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표 항목입니다."));

            Vote vote = option.getVote();
            Expense expense = vote.getExpense();
            Group group = expense.getGroup();

            // 마감 여부 확인
            if (vote.isClosed()) {
                return "❌ 이미 마감된 투표입니다. (마감: " + vote.getCloseAt().format(DATE_TIME_FORMATTER) + ")";
            }

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                return "❌ 해당 그룹의 멤버만 투표할 수 있습니다.";
            }

            // 지출 참여자 확인
            boolean isParticipant = expense.getParticipants().stream()
                    .anyMatch(p -> p.getUser().getId().equals(userId));
            if (!isParticipant) {
                return "❌ 해당 지출의 참여자만 투표할 수 있습니다.";
            }

            // 토글 처리
            boolean alreadyVoted = userVoteRepository.existsByUserAndVoteOption(user, option);
            String itemName = option.getExpenseItem().getName();

            if (alreadyVoted) {
                userVoteRepository.deleteByUserAndVoteOption(user, option);
                return String.format("🔄 '%s' 항목 투표를 취소했습니다.", itemName);
            } else {
                UserVote userVote = UserVote.builder()
                        .user(user)
                        .voteOption(option)
                        .build();
                userVoteRepository.save(userVote);
                return String.format("✅ '%s' 항목에 투표했습니다!", itemName);
            }

        } catch (Exception e) {
            log.error("투표 실패", e);
            return "❌ 투표 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 3. 투표 현황 조회
    // =================================================================================
    @Tool(description = "지출에 대한 투표 현황을 조회합니다. 각 항목별로 누가 투표했는지 확인할 수 있습니다.")
    public String getVoteStatus(
            @ToolParam(description = "조회할 지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);
            Group group = expense.getGroup();

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                return "❌ 해당 그룹의 멤버만 조회할 수 있습니다.";
            }

            // 투표 조회
            Vote vote = voteRepository.findByExpenseWithOptionsAndVotes(expense)
                    .orElse(null);

            if (vote == null) {
                return "⚠️ 아직 투표가 생성되지 않았습니다. 먼저 투표를 생성해주세요.";
            }

            // 전체 참여자
            Set<Long> allParticipantIds = expense.getParticipants().stream()
                    .map(p -> p.getUser().getId())
                    .collect(Collectors.toSet());

            // 투표한 사람
            Set<Long> votedUserIds = userVoteRepository.findVotedUserIdsByVote(vote);

            // 미투표자
            Set<Long> nonVotedUserIds = allParticipantIds.stream()
                    .filter(id -> !votedUserIds.contains(id))
                    .collect(Collectors.toSet());

            List<User> nonVotedUsers = userRepository.findAllById(nonVotedUserIds);
            String nonVotedNames = nonVotedUsers.isEmpty() ? "없음" :
                    nonVotedUsers.stream().map(User::getName).collect(Collectors.joining(", "));

            // 응답 생성
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📊 투표 현황: %s\n", expense.getTitle()));
            sb.append(String.format("- 상태: %s\n", vote.isClosed() ? "마감됨 ⏹️" : "진행중 ▶️"));
            sb.append(String.format("- 마감: %s\n", vote.getCloseAt().format(DATE_TIME_FORMATTER)));
            sb.append(String.format("- 미투표자: %s\n\n", nonVotedNames));

            sb.append("📋 항목별 현황:\n");

            List<UserVote> allVotes = userVoteRepository.findByVoteOptionVote(vote);

            for (VoteOption option : vote.getOptions()) {
                List<String> voterNames = allVotes.stream()
                        .filter(uv -> uv.getVoteOption().getId().equals(option.getId()))
                        .map(uv -> uv.getUser().getName())
                        .collect(Collectors.toList());

                String voters = voterNames.isEmpty() ? "아직 없음" : String.join(", ", voterNames);

                sb.append(String.format("  [ID:%d] %s (%,d원) - %d명\n",
                        option.getId(),
                        option.getExpenseItem().getName(),
                        option.getExpenseItem().getPrice(),
                        voterNames.size()));
                sb.append(String.format("    → 선택: %s\n", voters));
            }

            sb.append("\n💡 투표하려면 항목 ID를 사용하세요.");

            return sb.toString();

        } catch (Exception e) {
            log.error("투표 현황 조회 실패", e);
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 4. 투표 즉시 마감 (OWNER만)
    // =================================================================================
    @Tool(description = "투표를 즉시 마감합니다. 그룹 OWNER만 사용할 수 있습니다.")
    public String closeVote(
            @ToolParam(description = "마감할 투표의 지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);
            Group group = expense.getGroup();

            // OWNER 권한 확인
            GroupMember member = groupMemberRepository.findByUserAndGroup(user, group)
                    .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

            if (member.getRole() != Role.OWNER) {
                return "❌ 그룹 OWNER만 투표를 마감할 수 있습니다.";
            }

            // 정산 시작 여부 확인
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "❌ 이미 정산이 시작된 투표는 수정할 수 없습니다.";
            }

            // 투표 조회
            Vote vote = voteRepository.findByExpense(expense)
                    .orElseThrow(() -> new IllegalArgumentException("투표가 존재하지 않습니다."));

            if (vote.isClosed()) {
                return "⚠️ 이미 마감된 투표입니다.";
            }

            vote.closeNow();
            voteRepository.save(vote);

            return String.format("✅ '%s' 투표가 마감되었습니다.\n이제 정산을 진행할 수 있습니다.", expense.getTitle());

        } catch (Exception e) {
            log.error("투표 마감 실패", e);
            return "❌ 마감 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 5. 투표 기간 연장 (OWNER만)
    // =================================================================================
    @Tool(description = "투표 기간을 연장합니다. 그룹 OWNER만 사용할 수 있으며, 정산 시작 전에만 가능합니다.")
    public String extendVote(
            @ToolParam(description = "연장할 투표의 지출 ID") Long expenseId,
            @ToolParam(description = "새 마감 시간 (형식: yyyy-MM-dd HH:mm, 예: 2025-01-20 23:59)") String newCloseAt,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);
            Group group = expense.getGroup();

            // OWNER 권한 확인
            GroupMember member = groupMemberRepository.findByUserAndGroup(user, group)
                    .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

            if (member.getRole() != Role.OWNER) {
                return "❌ 그룹 OWNER만 투표 기간을 연장할 수 있습니다.";
            }

            // 정산 시작 여부 확인
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "❌ 이미 정산이 시작된 투표는 연장할 수 없습니다.";
            }

            // 투표 조회
            Vote vote = voteRepository.findByExpense(expense)
                    .orElseThrow(() -> new IllegalArgumentException("투표가 존재하지 않습니다."));

            // 새 마감 시간 파싱
            LocalDateTime newCloseDateTime;
            try {
                newCloseDateTime = LocalDateTime.parse(newCloseAt, DATE_TIME_FORMATTER);
            } catch (DateTimeParseException e) {
                return "❌ 날짜 형식이 올바르지 않습니다. (형식: yyyy-MM-dd HH:mm)";
            }

            if (newCloseDateTime.isBefore(LocalDateTime.now())) {
                return "❌ 마감 시간은 현재 시간 이후여야 합니다.";
            }

            vote.extendCloseAt(newCloseDateTime);
            voteRepository.save(vote);

            return String.format("✅ 투표 기간이 연장되었습니다.\n- 지출: %s\n- 새 마감: %s",
                    expense.getTitle(),
                    newCloseDateTime.format(DATE_TIME_FORMATTER));

        } catch (Exception e) {
            log.error("투표 연장 실패", e);
            return "❌ 연장 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // Helper Methods
    // =================================================================================

    private Long getUserIdFromContext(ToolContext context) {
        Long userId = (Long) context.getContext().get("currentUserId");
        if (userId == null) {
            throw new IllegalStateException("로그인 정보 없음");
        }
        return userId;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Expense getExpense(Long expenseId) {
        return expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));
    }
}