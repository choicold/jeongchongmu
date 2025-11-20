package com.jeongchongmu.expense.dto;

import com.jeongchongmu.expense.JPA.Expense;
import java.time.LocalDateTime;

// 그룹별 목록 조회를 위한 간소화된 DTO
public record ExpenseSimpleDTO(
        Long id,
        String title,
        Long amount,
        String payerName, // 👈 N+1 방지 (Fetch Join 필요)
        LocalDateTime expenseData
) {
    // 엔티티를 SimpleDTO로 변환하는 헬퍼 메서드
    public static ExpenseSimpleDTO fromEntity(Expense expense) {
        return new ExpenseSimpleDTO(
                expense.getId(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getPayer().getName(),
                expense.getExpenseData()
        );
    }
}