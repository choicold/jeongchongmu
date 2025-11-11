package com.jeongchongmu.common;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;


@Component
public class JwtUtil {

    @Value("${JWT_EXPIRATION}")
    private long tokenExpireTime;

    @Value("${JWT_SECRET}")
    private String secretKey;

    private SecretKey key;


    @PostConstruct
    public void init() {
        byte[] bytes = Base64.getDecoder().decode(secretKey);
        key = Keys.hmacShaKeyFor(bytes);
    }

    public String createToken(String email) {
        Date date = new Date();

        return Jwts.builder()
                .subject(email)
                .issuedAt(date)
                .expiration(new Date(date.getTime() + tokenExpireTime))
                .signWith(key)
                .compact();
    }

    public String getBearerTokenFromHeader(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }

    public boolean isBearerTokenValid(String bearerToken) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(bearerToken);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmailFromBearerToken(String bearerToken) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(bearerToken)
                .getPayload();

        return claims.getSubject();
    }


}
