package com.jeongchongmu.domain.expense.dto;

public record ExpenseItemDTO(
        String name,
        Long price,
        int quantity
){}

