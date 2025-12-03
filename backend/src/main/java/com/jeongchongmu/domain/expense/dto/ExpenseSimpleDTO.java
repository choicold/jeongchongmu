package com.jeongchongmu.domain.expense.dto;

import com.jeongchongmu.domain.expense.JPA.Expense;
import java.time.LocalDateTime;
import java.util.List;

// 그룹별 목록 조회를 위한 간소화된 DTO
public record ExpenseSimpleDTO(
        Long id,
        String title,
        Long amount,
        String payerName, // 👈 N+1 방지 (Fetch Join 필요)
        LocalDateTime expenseData,
        Long settlementId,  // 정산 ID (정산이 생성되지 않은 경우 null)
        Long voteId,  // 투표 ID (투표가 생성되지 않은 경우 null)
        Boolean isVoteClosed,  // 투표 마감 여부 (투표가 없으면 null)
        List<String> participants  // 참여자 이름 목록 (내 지출 필터링용)
) {
    // 엔티티를 SimpleDTO로 변환하는 헬퍼 메서드 (모든 필드 포함)
    public static ExpenseSimpleDTO fromEntity(Expense expense, Long settlementId, Long voteId, Boolean isVoteClosed) {
        // 참여자 이름 목록 추출
        List<String> participantNames = expense.getParticipants().stream()
                .map(participant -> participant.getUser().getName())
                .toList();

        return new ExpenseSimpleDTO(
                expense.getId(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getPayer().getName(),
                expense.getExpenseData(),
                settlementId,
                voteId,
                isVoteClosed,
                participantNames
        );
    }

    // 오버로드된 메서드 (settlementId만 포함, 기존 호환성 유지)
    public static ExpenseSimpleDTO fromEntity(Expense expense, Long settlementId) {
        return fromEntity(expense, settlementId, null, null);
    }

    // 오버로드된 메서드 (기존 호환성 유지 - 모든 추가 필드 null)
    public static ExpenseSimpleDTO fromEntity(Expense expense) {
        return fromEntity(expense, null, null, null);
    }
}