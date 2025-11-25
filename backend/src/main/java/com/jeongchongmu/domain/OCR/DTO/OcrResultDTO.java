package com.jeongchongmu.domain.OCR.DTO;

import com.jeongchongmu.domain.expense.dto.ExpenseItemDTO;
import java.time.LocalDateTime;
import java.util.List;

/**
 * OCR 된 결과
 * DB 저장 안함
 */
public record OcrResultDTO(
        String title,
        Long amount,
        LocalDateTime expenseData,
        List<ExpenseItemDTO> items// 아이템
) {}