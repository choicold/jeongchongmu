package com.jeongchongmu.expense.dto;

import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.JPA.ExpenseItem;
import com.jeongchongmu.expense.JPA.Tag;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record ExpenseDetailDTO(
        Long id,
        String title,
        Long amount,
        LocalDateTime expenseData,
        String payerName,
        Long groupId,
        List<String> items,
        List<String> participants,
        List<String> tagNames // 👈 [추가] 태그 목록
) {
    // 엔티티를 DTO로 변환하는 헬퍼 메서드
    public static ExpenseDetailDTO fromEntity(Expense expense) {

        List<String> itemNames = expense.getItems().stream()
                .map(ExpenseItem::getName)
                .collect(Collectors.toList());

        List<String> participantNames = expense.getParticipants().stream()
                .map(p -> p.getUser().getName()) // (Fetch Join 덕분에 쿼리 X)
                .collect(Collectors.toList());

        List<String> tagNames = expense.getTags().stream()
                .map(Tag::getName) // (Fetch Join 덕분에 쿼리 X)
                .collect(Collectors.toList());

        return new ExpenseDetailDTO(
                expense.getId(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getExpenseData(),
                expense.getPayer().getName(),
                expense.getGroup().getId(),
                itemNames,
                participantNames,
                tagNames
        );
    }
}