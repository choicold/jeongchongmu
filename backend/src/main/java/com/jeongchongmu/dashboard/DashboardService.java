package com.jeongchongmu.dashboard;

import com.jeongchongmu.dashboard.dto.DashboardResponseDto;
import com.jeongchongmu.dashboard.dto.RecentActivityDto;
import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.group.dto.GroupDto;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.repository.GroupRepository;
import com.jeongchongmu.settlement.dto.SettlementSummaryResponseDto;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 대시보드 서비스
 * 메인 화면에 필요한 모든 데이터를 효율적으로 제공합니다.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {
    private final GroupRepository groupRepository;
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;

    /**
     * 대시보드 데이터 조회
     *
     * @param userId 사용자 ID
     * @return 대시보드 응답 DTO
     */
    @Transactional(readOnly = true)
    public DashboardResponseDto getDashboard(Long userId) {
        // 1. 그룹 목록 조회 (최대 5개)
        List<Group> groups = groupRepository.findByUserId(userId);
        List<GroupDto> groupDtos = groups.stream()
                .limit(5)
                .map(this::toGroupDto)
                .collect(Collectors.toList());

        // 2. 이번 달 총 지출 (모든 그룹 합산)
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        Long thisMonthExpense = expenseRepository.findUserTotalMonthlyExpense(year, month, userId);

        // 3. 최근 활동 (최대 5개, 정산 정보 포함)
        List<Expense> recentExpenses = expenseRepository.findRecentExpensesByUser(
                userId,
                PageRequest.of(0, 5)
        );
        List<RecentActivityDto> recentActivities = recentExpenses.stream()
                .map(this::toRecentActivityDto)
                .collect(Collectors.toList());

        // 4. 정산 현황 (받을 돈 / 보낼 돈)
        SettlementSummaryResponseDto settlementSummary = settlementRepository.findMySettlementSummary(userId);
        Long toReceive = settlementSummary != null ? settlementSummary.toReceive() : 0L;
        Long toSend = settlementSummary != null ? settlementSummary.toSend() : 0L;

        return DashboardResponseDto.builder()
                .groups(groupDtos)
                .thisMonthExpense(thisMonthExpense != null ? thisMonthExpense : 0L)
                .recentActivities(recentActivities)
                .toReceive(toReceive)
                .toSend(toSend)
                .build();
    }

    /**
     * Group 엔티티를 GroupDto로 변환
     */
    private GroupDto toGroupDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .icon(group.getIcon())
                .inviteCode(group.getInviteCode())
                .inviteLink(group.getInviteLink())
                .creator(group.getCreator() != null ? new GroupDto.UserSummary(
                        group.getCreator().getId(),
                        group.getCreator().getName()
                ) : null)
                .memberCount(group.getMembers() != null ? group.getMembers().size() : 0)
                .createdAt(group.getCreatedAt())
                .build();
    }

    /**
     * Expense 엔티티를 RecentActivityDto로 변환
     */
    private RecentActivityDto toRecentActivityDto(Expense expense) {
        // 참여자 이름 목록
        List<String> participants = expense.getParticipants() != null
                ? expense.getParticipants().stream()
                        .map(p -> p.getUser().getName())
                        .collect(Collectors.toList())
                : List.of();

        // 정산 정보
        Long settlementId = expense.getSettlement() != null ? expense.getSettlement().getId() : null;
        String settlementStatus = expense.getSettlement() != null
                ? expense.getSettlement().getStatus().name()
                : null;

        return RecentActivityDto.builder()
                .expenseId(expense.getId())
                .groupId(expense.getGroup().getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .payerName(expense.getPayer().getName())
                .expenseDate(expense.getExpenseData())
                .settlementId(settlementId)
                .settlementStatus(settlementStatus)
                .participants(participants)
                .build();
    }
}
