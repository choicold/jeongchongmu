package com.jeongchongmu.domain.expense.dto;

import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.JPA.Tag;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record ExpenseDetailDTO(
        Long id,
        String title,
        Long amount,
        LocalDateTime expenseData,
        String receiptUrl,
        String payerName,
        Long groupId,
        List<ExpenseItemDTO> items,
        List<String> participants,
        List<String> tagNames,
        Long settlementId  // 정산 ID (정산이 생성되지 않은 경우 null)
) {
    // 엔티티를 DTO로 변환하는 헬퍼 메서드 (settlementId 포함)
    public static ExpenseDetailDTO fromEntity(Expense expense, Long settlementId) {

        // 1. 아이템 상세 정보 변환 (이름, 가격, 수량)
        List<ExpenseItemDTO> itemDtos = expense.getItems().stream()
                .map(item -> new ExpenseItemDTO(
                        item.getName(),
                        item.getPrice(),
                        item.getQuantity()
                ))
                .collect(Collectors.toList());

        // 2. 참여자 이름 리스트
        List<String> participantNames = expense.getParticipants().stream()
                .map(p -> p.getUser().getName())
                .collect(Collectors.toList());

        // 3. 태그 이름 리스트
        List<String> tagNames = expense.getTags().stream()
                .map(Tag::getName)
                .collect(Collectors.toList());

        return new ExpenseDetailDTO(
                expense.getId(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getExpenseData(),
                expense.getReceiptUrl(),
                expense.getPayer().getName(),
                expense.getGroup().getId(),
                itemDtos,
                participantNames,
                tagNames,
                settlementId
        );
    }

    // 오버로드된 메서드 (기존 호환성 유지 - settlementId 없이 호출 가능)
    public static ExpenseDetailDTO fromEntity(Expense expense) {
        return fromEntity(expense, null);
    }
}