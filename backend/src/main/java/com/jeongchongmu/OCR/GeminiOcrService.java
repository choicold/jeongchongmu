package com.jeongchongmu.OCR;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.*;
import com.jeongchongmu.OCR.DTO.OcrResultDTO;
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

        // 3. [전략 변경] 프롬프트에 JSON 구조를 텍스트로 명확히 박아넣기
        // quantity(수량)까지 포함하여 요청합니다.
        String promptText = """
                You are a strict OCR assistant. Analyze this receipt image and extract data into the following JSON format.
                
                Rules:
                1. Output MUST be raw JSON only. No Markdown formatting (no ```json).
                2. If a field is missing, use null or appropriate default.
                3. Date format must be ISO-8601 (YYYY-MM-DDTHH:mm:ss).
                
                Required JSON Structure:
                {
                  "title": "Store Name",
                  "amount": 10000 (Integer, total price),
                  "expenseData": "2023-10-27T12:00:00",
                  "items": [
                    {
                      "name": "Item Name",
                      "price": 5000 (Integer),
                      "quantity": 1 (Integer, default 1)
                    }
                  ]
                }
                """;

        // 4. 요청 데이터 구성
        // Schema 설정(GenerateContentConfig) 제거하고 기본 요청으로 보냄
        Content content = Content.builder()
                .parts(List.of(
                        Part.builder().text(promptText).build(),
                        Part.builder().inlineData(Blob.builder()
                                .mimeType(imageFile.getContentType())
                                .data(imageBytes) // byte[] 직접 주입
                                .build()).build()
                ))
                .build();

        try {
            // 5. API 호출 (Config 없이 호출)
            GenerateContentResponse response = client.models.generateContent(MODEL_NAME, content, null);

            String responseText = response.text();
            log.info("Gemini Raw Response: {}", responseText);

            // 6. 혹시 모를 마크다운 백틱 제거 (Gemini가 말을 안 듣고 넣어줄 때를 대비)
            String cleanJson = responseText
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            // 7. Jackson으로 파싱 (이제 DTO와 JSON 필드명이 일치하므로 자동 변환됨)
            return objectMapper.readValue(cleanJson, OcrResultDTO.class);

        } catch (Exception e) {
            log.error("Gemini OCR Parsing Failed", e);
            // 파싱 실패 시 로그에 원본 응답을 남겨둬야 디버깅이 편함
            throw new IOException("Failed to process receipt image. Check logs for details.");
        }
    }
}