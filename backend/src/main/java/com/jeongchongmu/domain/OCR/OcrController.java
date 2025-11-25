package com.jeongchongmu.domain.OCR;


import com.jeongchongmu.domain.OCR.DTO.OcrResultDTO;
import com.jeongchongmu.domain.OCR.DTO.OcrScanResponseDTO;
import com.jeongchongmu.domain.OCR.service.FileStorageService;
import com.jeongchongmu.domain.OCR.service.OcrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;
    private final FileStorageService fileStorageService;

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OcrScanResponseDTO> scanReceipt(
            @RequestParam("image") MultipartFile image
    ) throws IOException {

        // 0. 파일 유효성 검사
        if (image.isEmpty()) {
            throw new IllegalArgumentException("업로드된 파일이 비어있습니다.");
        }
        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        log.info("Starting receipt scan process...");

        // 1. [파일 저장] Supabase에 저장 후 Public URL 확보
        String receiptUrl = fileStorageService.saveFile(image);
        log.info("File uploaded successfully. URL: {}", receiptUrl);

        // 2. [OCR 분석] Gemini 서비스 호출
        OcrResultDTO ocrResult = ocrService.recognize(image);
        log.info("OCR analysis completed for: {}", ocrResult.title());

        // 3. [응답] 평탄화된 DTO 생성 (수정된 부분)
        // ocrResult 껍질을 벗기고 내용물과 url을 합칩니다.
        OcrScanResponseDTO response = OcrScanResponseDTO.from(ocrResult, receiptUrl);

        return ResponseEntity.ok(response);
    }
}