package com.jeongchongmu.domain.OCR.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupabaseStorageService implements FileStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String saveFile(MultipartFile file) throws IOException {

        // 1. 파일명 중복 방지 (UUID 사용)
        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String savedFileName = UUID.randomUUID() + extension;

        // 2. Supabase Storage API URL 구성
        // POST /storage/v1/object/{bucket}/{filename}
        String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, savedFileName);

        log.info("Uploading file to Supabase: {}", savedFileName);

        // 3. 헤더 설정 (Auth + Content-Type)
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "image/jpeg";
        }
        headers.setContentType(MediaType.parseMediaType(contentType));

        // 4. 요청 본문 생성 (이미지 바이너리)
        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

        // 5. 전송 (RestTemplate 사용)
        try {
            restTemplate.exchange(uploadUrl, HttpMethod.POST, requestEntity, String.class);
        } catch (Exception e) {
            log.error("Supabase Upload Failed: {}", e.getMessage());
            throw new IOException("이미지 업로드에 실패했습니다. (Supabase Error)");
        }

        // 6. 접속 가능한 Public URL 반환
        // URL 패턴: {url}/storage/v1/object/public/{bucket}/{filename}
        return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, savedFileName);
    }

    // 확장자 추출 유틸 메소드
    private String getExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return ".jpg"; // 기본값
    }
}