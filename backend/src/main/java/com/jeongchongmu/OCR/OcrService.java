package com.jeongchongmu.OCR;


import com.jeongchongmu.OCR.DTO.OcrResultDTO;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.io.IOException;

public interface OcrService {

    /**
     * 영수증 scan 후 OcrResultDTO 반환
     * @param imageFile 원본 이미지 파일
     * @return OCR 분석 결과 DTO
     * @throws IOException 파일 처리 중 예외 발생
     */
    OcrResultDTO recognize(MultipartFile imageFile) throws IOException;

}