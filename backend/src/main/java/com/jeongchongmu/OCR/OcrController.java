package com.jeongchongmu.OCR;


import com.jeongchongmu.OCR.DTO.OcrResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;
//    private final FileStorageService fileStorageService;

    /**
     * [스캔 API]
     * 영수증 이미지를 업로드받아 S3에 저장하고,
     * OCR로 텍스트를 분석하여 두 결과를 조합해 반환 (DB 저장 X)
     */
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OcrResultDTO> scanReceipt(
            @RequestParam("image") MultipartFile image
    ) throws IOException {

//        // 1. [파일 저장] S3/GCS 등에 파일 저장 후 URL 확보
//        String receiptUrl = fileStorageService.saveFile(image);

        // 2. [OCR 분석] MultipartFile 객체를 서비스로 전달
        OcrResultDTO ocrResult = ocrService.recognize(image);

        return ResponseEntity.ok(ocrResult);

//        // 3. [응답] 스캔 결과(DTO)와 파일 URL을 조합하여 반환
//        OcrScanResponseDTO response = new OcrScanResponseDTO(ocrResult, receiptUrl);
//        return ResponseEntity.ok(response);
    }
}