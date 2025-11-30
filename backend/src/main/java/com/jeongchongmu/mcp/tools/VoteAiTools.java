package com.jeongchongmu.mcp.tools;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class VoteAiTools {

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
    @Tool(description = "지출 내역에 대한 항목별 정산 투표를 생성합니다. 그룹 멤버들이 각자 먹은/사용한 항목을 선택할 수 있게 됩니다. 이미 투표가 존재하면 해당 투표 ID를 반환합니다.")
    @Transactional
    public String createVote(
            @ToolParam(description = "투표를 생성할 지출 ID") Long expenseId,
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

            // [추가된 로직] 이미 정산(Settlement)이 진행 중인지 확인
            // 정산이 존재한다면, 이미 N빵이나 다른 방식으로 확정된 것이므로 투표를 생성하면 안 됨.
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "❌ 이미 정산(청구서)이 생성된 지출입니다.\n" +
                        "투표를 진행하려면 기존 정산을 먼저 삭제해주세요.";
            }

            // 이미 투표가 있는지 확인 - 있으면 기존 투표 ID 반환
            var existingVote = voteRepository.findByExpense(expense);
            if (existingVote.isPresent()) {
                Vote vote = existingVote.get();
                return String.format("ℹ️ 이미 해당 지출에 대한 투표가 존재합니다.\n" +
                                "- 투표 ID: %d\n" +
                                "- 지출: %s\n" +
                                "- 상태: %s",
                        vote.getId(),
                        expense.getTitle(),
                        vote.isClosed() ? "마감됨" : "진행중");
            }

            // 투표 생성 로직 (기존과 동일)
            Vote vote = Vote.builder()
                    .expense(expense)
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
                            "- 투표 ID: %d\n" +
                            "- 지출: %s (%,d원)\n" +
                            "- 항목 수: %d개\n" +
                            "- 참여 대상: %s\n\n" +
                            "💡 참여자들은 본인이 먹은/사용한 항목에 투표해주세요!",
                    vote.getId(),
                    expense.getTitle(),
                    expense.getAmount(),
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
    @Transactional
    public String castVote(
            @ToolParam(description = "투표할 항목(옵션) ID") Long optionId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            VoteOption option = voteOptionRepository.findById(optionId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표 항목입니다."));

            Vote vote = option.getVote();
            Expense expense = vote.getExpense();
            Group group = expense.getGroup();

            // 마감 여부 확인
            if (vote.isClosed()) {
                return "❌ 이미 마감된 투표입니다.";
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

                // 모든 참여자 투표 완료 여부 확인
                List<User> participants = expense.getParticipants().stream()
                        .map(p -> p.getUser())
                        .collect(Collectors.toList());

                boolean allVoted = participants.stream()
                        .allMatch(participant ->
                                vote.getOptions().stream()
                                        .anyMatch(opt -> userVoteRepository.existsByUserAndVoteOption(participant, opt))
                        );

                if (allVoted) {
                    return String.format("✅ '%s' 항목에 투표했습니다!\n\n" +
                            "🎉 모든 참여자가 투표를 완료했습니다! 정산 결과를 확인할 수 있습니다.", itemName);
                }

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
    @Transactional(readOnly = true)
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
            Vote vote = voteRepository.findByExpense(expense)
                    .orElse(null);

            if (vote == null) {
                return "⚠️ 아직 투표가 생성되지 않았습니다. 먼저 투표를 생성해주세요.";
            }

            // 전체 참여자
            Set<Long> allParticipantIds = expense.getParticipants().stream()
                    .map(p -> p.getUser().getId())
                    .collect(Collectors.toSet());

            // 모든 투표 내역 조회
            List<UserVote> allVotes = userVoteRepository.findAll().stream()
                    .filter(uv -> vote.getOptions().stream()
                            .anyMatch(opt -> opt.getId().equals(uv.getVoteOption().getId())))
                    .collect(Collectors.toList());

            // 투표한 사람 ID 집합
            Set<Long> votedUserIds = allVotes.stream()
                    .map(uv -> uv.getUser().getId())
                    .collect(Collectors.toSet());

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
            sb.append(String.format("- 투표 ID: %d\n", vote.getId()));
            sb.append(String.format("- 지출자: %s\n", expense.getPayer().getName()));
            sb.append(String.format("- 상태: %s\n", vote.isClosed() ? "마감됨 ⏹️" : "진행중 ▶️"));
            sb.append(String.format("- 미투표자: %s\n\n", nonVotedNames));

            sb.append("📋 항목별 현황:\n");

            for (VoteOption option : vote.getOptions()) {
                List<String> voterNames = allVotes.stream()
                        .filter(uv -> uv.getVoteOption().getId().equals(option.getId()))
                        .map(uv -> uv.getUser().getName())
                        .collect(Collectors.toList());

                String voters = voterNames.isEmpty() ? "아직 없음" : String.join(", ", voterNames);

                sb.append(String.format("  [옵션 ID:%d] %s (%,d원) - %d명\n",
                        option.getId(),
                        option.getExpenseItem().getName(),
                        option.getExpenseItem().getPrice().longValue(),
                        voterNames.size()));
                sb.append(String.format("    → 선택: %s\n", voters));
            }

            sb.append("\n💡 투표하려면 옵션 ID를 사용하세요.");

            return sb.toString();

        } catch (Exception e) {
            log.error("투표 현황 조회 실패", e);
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 4. 투표 삭제
    // =================================================================================
    @Tool(description = "투표를 삭제합니다. 마감되지 않은 투표만 삭제할 수 있습니다. 투표를 다시 진행하고 싶을 때 사용합니다.")
    @Transactional
    public String deleteVote(
            @ToolParam(description = "삭제할 투표의 지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);
            Group group = expense.getGroup();

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                return "❌ 해당 그룹의 멤버만 투표를 삭제할 수 있습니다.";
            }

            // 투표 조회
            Vote vote = voteRepository.findByExpense(expense)
                    .orElseThrow(() -> new IllegalArgumentException("투표가 존재하지 않습니다."));

            // 마감 여부 확인
            if (vote.isClosed()) {
                return "❌ 이미 마감된 투표는 삭제할 수 없습니다.";
            }

            String expenseTitle = expense.getTitle();

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

            return String.format("✅ '%s' 지출의 투표가 삭제되었습니다.\n필요하면 새로 투표를 생성할 수 있습니다.", expenseTitle);

        } catch (Exception e) {
            log.error("투표 삭제 실패", e);
            return "❌ 삭제 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 5. [NEW] 진행 중인 투표 목록 조회 (사용자가 '투표할래' 했을 때 보여줄 목록)
    // =================================================================================
    @Tool(description = "사용자가 속한 모든 그룹에서 현재 진행 중(마감되지 않은)인 투표 목록을 조회합니다. 사용자가 '투표할래', '투표 목록 보여줘'라고 말할 때 사용하세요.")
    @Transactional(readOnly = true)
    public String getOngoingVotes(ToolContext context) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);

            // 1. 내가 속한 그룹 찾기
            List<GroupMember> myMemberships = groupMemberRepository.findByUser(user);
            if (myMemberships.isEmpty()) {
                return "가입된 그룹이 없어 투표를 조회할 수 없습니다.";
            }

            List<Long> myGroupIds = myMemberships.stream()
                    .map(gm -> gm.getGroup().getId())
                    .collect(Collectors.toList());

            // 2. 진행 중인 투표 조회
            List<Vote> ongoingVotes = voteRepository.findByExpense_Group_IdInAndIsClosedFalse(myGroupIds);

            if (ongoingVotes.isEmpty()) {
                return "현재 진행 중인 투표가 없습니다. 새로운 지출(ID)에 대해 투표를 생성해보세요!";
            }

            // 3. 결과 포맷팅
            StringBuilder sb = new StringBuilder();
            sb.append("🗳️ **현재 참여 가능한 투표 목록**\n\n");

            for (Vote vote : ongoingVotes) {
                Expense expense = vote.getExpense();
                Group group = expense.getGroup();

                // 내가 이미 참여했는지(하나라도 찍었는지) 체크
                boolean iVoted = vote.getOptions().stream()
                        .anyMatch(opt -> userVoteRepository.existsByUserAndVoteOption(user, opt));

                String status = iVoted ? "✅참여완료 (수정가능)" : "🔥참여필요";
                String dateStr = expense.getExpenseData().format(DateTimeFormatter.ofPattern("MM/dd"));

                sb.append(String.format("📌 **지출 ID: %d** | %s\n", expense.getId(), status)); // 사용자가 지출ID로 접근하는게 편하므로 지출 ID 강조
                sb.append(String.format("   - 항목: **%s** (%,d원)\n", expense.getTitle(), expense.getAmount()));
                sb.append(String.format("   - 그룹: %s | 날짜: %s\n", group.getName(), dateStr));
                sb.append(String.format("   - 투표 인원: %d명 참여중\n\n", countVoters(vote)));
            }

            sb.append("💡 투표에 참여하려면 **'지출 ID OOO번 상세 보여줘'** 또는 **'OOO(항목명) 투표할래'**라고 말씀해주세요.");

            return sb.toString();

        } catch (Exception e) {
            log.error("투표 목록 조회 실패", e);
            return "❌ 투표 목록 조회 실패: " + e.getMessage();
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

    private long countVoters(Vote vote) {
        return userVoteRepository.findAll().stream()
                .filter(uv -> uv.getVoteOption().getVote().getId().equals(vote.getId()))
                .map(uv -> uv.getUser().getId())
                .distinct()
                .count();
    }
}