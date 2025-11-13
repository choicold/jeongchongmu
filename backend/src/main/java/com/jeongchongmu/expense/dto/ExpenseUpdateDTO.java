package com.jeongchongmu.expense.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ExpenseUpdateDTO(
        String title,
        Long amount,
        LocalDateTime expenseData,

        List<Long> participantIds, //참여자
        List<ExpenseItemDTO> items //아이템
) { }
