package com.jeongchongmu.OCR;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.File; // Google GenAI File Type
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.jeongchongmu.OCR.DTO.OcrResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiOcrService implements OcrService {

    private final Client client;

    // 20MB = 20 * 1024 * 1024 bytes
    private static final long MAX_INLINE_SIZE = 20L * 1024 * 1024;

    @Override
    public OcrResultDTO recognize(MultipartFile imageFile) throws IOException {
        long startTime = System.currentTimeMillis();
        String resultText = "";

        // ==========================================
        // 1. 이미지 크기에 따른 Content 생성 분기 처리
        // ==========================================
        Content content;

        // 테스트용 프롬프트 (나중에 실제 영수증 분석 프롬프트로 교체하세요)
        String promptText = "This is a latency test. Analyze this image and just reply with 'Checked'.";
        Part textPart = Part.fromText(promptText);

        if (imageFile.getSize() < MAX_INLINE_SIZE) {
            // === Case A: 20MB 미만 (Inline 전송) ===
            log.info("Image size is small ({} bytes). Using Inline processing.", imageFile.getSize());

            Part imagePart = Part.fromBytes(
                    imageFile.getBytes(),
                    "image/jpeg" // 혹은 imageFile.getContentType() 사용 가능
            );

            content = Content.fromParts(Arrays.asList(textPart, imagePart));

        } else {
            // === Case B: 20MB 이상 (File API 업로드) ===
            log.info("Image size is large ({} bytes). Using File API.", imageFile.getSize());

            // 1) MultipartFile을 로컬 임시 파일로 저장
            Path tempPath = Files.createTempFile("gemini_upload_", ".jpg");
            java.io.File tempFile = tempPath.toFile();

            try {
                imageFile.transferTo(tempFile);

                // 2) Gemini 서버로 파일 업로드
                File uploadedFile = client.files.upload(
                        tempFile.getAbsolutePath(),
                        null // Config (필요시 mimeType 지정)
                );

                log.info("File uploaded to Gemini: {}", uploadedFile.uri());

                // 3) URI를 이용해 Part 생성
                Part filePart = Part.fromUri(uploadedFile.uri(), uploadedFile.mimeType());
                content = Content.fromParts(Arrays.asList(textPart, filePart));

            } finally {
                // 4) 로컬 임시 파일 삭제 (중요)
                if (tempFile.exists()) {
                    tempFile.delete();
                }
            }
        }

        // ==========================================
        // 2. Gemini API 호출
        // ==========================================
        try {
            GenerateContentResponse response = client.models.generateContent(
                    "gemini-2.0-flash-exp", // 혹은 gemini-2.5-flash
                    content,
                    null // Config (필요시 설정)
            );

            resultText = response.text();

        } catch (Exception e) {
            log.error("Gemini API Error", e);
            throw new IOException("Gemini processing failed: " + e.getMessage());
        }

        // 3. Latency 계산 및 반환
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("Gemini Latency: " + duration + "ms");
        System.out.println("Gemini Response: " + resultText);

        // DTO 반환 (현재는 테스트용으로 제목과 시간만 채움)
        return new OcrResultDTO(resultText, duration, null, null);
    }
}