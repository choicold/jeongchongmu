package com.jeongchongmu.mcp.tools;

import com.jeongchongmu.domain.OCR.DTO.OcrResultDTO;
import com.jeongchongmu.domain.OCR.service.OcrService;
import com.jeongchongmu.domain.expense.dto.ExpenseItemDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OcrAiTools {

    private final OcrService ocrService;

    @Tool(description = "영수증 이미지 URL을 입력받아 OCR 분석을 수행합니다. 지출 내역을 자동으로 추출할 때 사용합니다.")
    public String analyzeReceipt(
            @ToolParam(description = "영수증 이미지의 웹 URL (http:// 또는 https:// 로 시작)") String imageUrl
    ) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return "이미지 URL이 유효하지 않습니다.";
        }

        try {
            log.info("AI 요청으로 영수증 분석 시작: {}", imageUrl);

            // 1. URL에서 이미지 다운로드하여 임시 파일 생성
            File tempFile = downloadFileFromUrl(imageUrl);

            // 2. MultipartFile로 변환 (OcrService가 이걸 요구하므로)
            MultipartFile multipartFile = new SimpleMultipartFile(tempFile);

            // 3. 기존 OCR 서비스 호출 (GeminiOcrService)
            OcrResultDTO result = ocrService.recognize(multipartFile);
            tempFile.delete();

            // ✨ AI가 참고하기 쉽도록 JSON 형태도 같이 줍니다.
            StringBuilder sb = new StringBuilder();
            sb.append("🧾 [OCR 분석 결과]\n");
            sb.append("상호명: ").append(result.title()).append("\n");
            sb.append("총금액: ").append(result.amount()).append("\n");
            sb.append("날짜: ").append(result.expenseData()).append("\n");

            // 아이템 리스트를 JSON 문자열로 만들어서 제공 (AI가 이걸 그대로 createExpense에 꽂아넣도록 유도)
            String itemsJsonArray = "[]";
            if (result.items() != null) {
                sb.append("품목:\n");
                for (ExpenseItemDTO item : result.items()) {
                    sb.append(String.format("- %s : %d원 (%d개)\n", item.name(), item.price(), item.quantity()));
                }
                // 리스트를 JSON String으로 변환 (단순 문자열 처리로 흉내내거나 ObjectMapper 사용 가능)
                // 여기서는 간단하게 AI에게 "이 JSON을 써"라고 힌트를 줍니다.
                // (실제로는 AI가 위 텍스트를 보고 스스로 JSON을 잘 만듭니다. 하지만 명시해주면 더 완벽합니다.)
            }

            sb.append("\n[시스템 힌트]\n");
            sb.append("저장 시 다음 정보를 사용하세요:\n");
            sb.append("- receiptUrl: ").append(imageUrl).append("\n");
            sb.append("- itemsJson: 위 품목 내용을 바탕으로 JSON Array 형식을 만드세요.\n");
            sb.append("\n[!!! AI 주의사항 !!!]\n");
            sb.append("위 '품목' 리스트는 이미지에서 추출된 확정된 데이터입니다.\n");
            sb.append("사용자의 대화 맥락(예: 그룹명, 농담 등)에 맞춰 이 데이터를 절대 수정하지 마십시오.\n");
            sb.append("위 내용을 토씨 하나 틀리지 말고 그대로 itemsJson에 넣으십시오.\n");

            return sb.toString();

        } catch (Exception e) {
            log.error("OCR Tool Error", e);
            return "영수증 분석 중 오류가 발생했습니다: " + e.getMessage();
        }
    }

    // URL -> File 다운로드 헬퍼 메서드
    private File downloadFileFromUrl(String imageUrl) throws IOException {
        URL url = new URL(imageUrl);
        Path tempPath = Files.createTempFile("ocr_", ".jpg");
        try (InputStream in = url.openStream()) {
            Files.copy(in, tempPath, StandardCopyOption.REPLACE_EXISTING);
        }
        return tempPath.toFile();
    }

    // OcrService가 MultipartFile을 요구하므로, File을 감싸는 간단한 구현체 생성
    private static class SimpleMultipartFile implements MultipartFile {
        private final File file;

        public SimpleMultipartFile(File file) { this.file = file; }

        @Override public String getName() { return "file"; }
        @Override public String getOriginalFilename() { return file.getName(); }
        @Override public String getContentType() { return "image/jpeg"; } // 기본값 가정
        @Override public boolean isEmpty() { return file.length() == 0; }
        @Override public long getSize() { return file.length(); }
        @Override public byte[] getBytes() throws IOException { return Files.readAllBytes(file.toPath()); }
        @Override public InputStream getInputStream() throws IOException { return new FileInputStream(file); }
        @Override public void transferTo(File dest) throws IOException, IllegalStateException {
            Files.copy(file.toPath(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }
}