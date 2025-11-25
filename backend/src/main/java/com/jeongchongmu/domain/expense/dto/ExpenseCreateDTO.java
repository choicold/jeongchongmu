package com.jeongchongmu.domain.expense.dto;

import java.time.LocalDateTime;
import java.util.List;


public record ExpenseCreateDTO(
        String title,
        Long amount,
        LocalDateTime expenseData,
        Long groupId,//객체 아님

        List<Long> participantIds,// 참여자ID
        List<ExpenseItemDTO> items,// 아이템 객체
        List<String> tagNames, // tag를 string형태로
        String receiptUrl
) {}
