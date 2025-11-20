package com.jeongchongmu.config; // (패키지는 적절히 조절하세요)

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class geminiConfig {

    @Value("${google.api.key}")
    private String apiKey;

    @Bean
    public Client geminiClient() {
        // 애플리케이션 시작 시 단 한 번만 Client 객체를 생성합니다.
        return Client.builder().apiKey(apiKey).build();
    }
}