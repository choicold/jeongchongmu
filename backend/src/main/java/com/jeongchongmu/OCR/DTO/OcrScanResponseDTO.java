package com.jeongchongmu.OCR.DTO;

/**
 * OcrController가 클라이언트에 반환할 최종 응답 DTO
 */
public record OcrScanResponseDTO(
        OcrResultDTO ocrResult, // 1. OCR 인식 텍스트 결과
        String receiptUrl       // 2. 영수증 이미지 URL
) {}