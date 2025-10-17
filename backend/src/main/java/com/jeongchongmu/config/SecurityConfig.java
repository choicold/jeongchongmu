package com.jeongchongmu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        // ⭐ Actuator Health Check 허용 ⭐
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/info").permitAll()

                        // Swagger 허용
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // 나머지 설정...
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
