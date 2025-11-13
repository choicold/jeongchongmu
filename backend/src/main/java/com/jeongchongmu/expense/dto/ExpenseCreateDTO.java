package com.jeongchongmu.expense.dto;

import java.time.LocalDateTime;
import java.util.List;


public record ExpenseCreateDTO(
        String title,
        Long amount,
        LocalDateTime expenseData,
        Long groupId,//객체 아님
        Long payerId,//객체 아님

        List<Long> participantIds,//참여자의 KEY
        List<ExpenseItemDTO> items
) {}
