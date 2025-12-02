package com.jeongchongmu.domain.OCR.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.*;
import com.jeongchongmu.domain.OCR.DTO.OcrResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiOcrService implements OcrService {

    @Value("${spring.ai.gemini.api-key}")
    private String apiKey;

    private static final String MODEL_NAME = "gemini-2.5-flash";

    private final ObjectMapper objectMapper;

    @Override
    public OcrResultDTO recognize(MultipartFile imageFile) throws IOException {

        // 1. Client 생성
        Client client = Client.builder().apiKey(apiKey).build();

        // 2. 이미지 바이트 준비
        byte[] imageBytes = imageFile.getBytes();

        // 3. [전략 변경] 프롬프트 수정: price를 개별 단가(Unit Price)로 추출하도록 변경
        String promptText = """
            You are a strict OCR assistant. Analyze this receipt image and extract data into the following JSON format.
            
            Rules:
            1. Output MUST be raw JSON only. No Markdown formatting (no ```json).
            2. If a field is missing, use null or appropriate default.
            3. Date format must be ISO-8601 (YYYY-MM-DDTHH:mm:ss).
            4. [IMPORTANT] For the 'items' list, the 'price' field MUST be the 'Unit Price' (Individual Item Price). 
               Extract the 'Unit Price' (단가) column. Do NOT extract the 'Amount' (금액/Total Line Amount).
               (e.g., If Unit Price is 1,300 and Qty is 2, 'price' must be 1,300).
            
            Required JSON Structure:
            {
              "title": "Store Name",
              "amount": 27600 (Integer, Total sum of the receipt),
              "expenseData": "2010-03-24T21:17:00",
              "items": [
                {
                  "name": "Item Name",
                  "price": 1300 (Integer, Unit Price per item),
                  "quantity": 2 (Integer)
                }
              ]
            }
            """;

        // 4. 요청 데이터 구성
        Content content = Content.builder()
                .parts(List.of(
                        Part.builder().text(promptText).build(),
                        Part.builder().inlineData(Blob.builder()
                                .mimeType(imageFile.getContentType())
                                .data(imageBytes)
                                .build()).build()
                ))
                .build();

        try {
            // 5. API 호출
            GenerateContentResponse response = client.models.generateContent(MODEL_NAME, content, null);

            String responseText = response.text();
            log.info("Gemini Raw Response: {}", responseText);

            if (responseText == null) {
                throw new IOException("Gemini API로부터 응답을 받지 못했습니다.");
            }

            // 6. 마크다운 백틱 제거
            String cleanJson = responseText
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            // 7. Jackson으로 파싱
            return objectMapper.readValue(cleanJson, OcrResultDTO.class);

        } catch (Exception e) {
            log.error("Gemini OCR Parsing Failed", e);
            throw new IOException("Failed to process receipt image. Check logs for details.");
        }
    }
}