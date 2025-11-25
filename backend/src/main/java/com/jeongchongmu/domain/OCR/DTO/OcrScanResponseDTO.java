package com.jeongchongmu.domain.OCR.DTO;

import com.jeongchongmu.domain.expense.dto.ExpenseItemDTO;
import java.time.LocalDateTime;
import java.util.List;

/**
 * OcrController가 클라이언트에 반환할 최종 응답 DTO
 */
public record OcrScanResponseDTO(
        String title,
        Long amount,
        LocalDateTime expenseData,
        List<ExpenseItemDTO> items,
        String receiptUrl
) {
    public static OcrScanResponseDTO from(OcrResultDTO result, String url) {
        return new OcrScanResponseDTO(
                result.title(),
                result.amount(),
                result.expenseData(),
                result.items(),
                url
        );
    }
}