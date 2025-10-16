package com.jeongchongmu.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("정총무 API")
                        .version("1.0.0")
                        .description("LLM 기반 그룹 정산 및 소비 내역 관리 API")
                        .contact(new Contact()
                                .name("캡스톤팀")
                                .email("team@jeongchongmu.com")))
                .servers(List.of(
                        new Server().url("http://localhost:8080")
                                .description("로컬 개발 서버"),
                        new Server().url("https://api.jeongchongmu.com")
                                .description("프로덕션 서버")
                ));
    }
}
