package com.jeongchongmu.common;

import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        System.out.println("=== 요청 들어옴: " + request.getMethod() + " " + request.getRequestURI());

        String bearerToken = jwtUtil.getBearerTokenFromHeader(request);

        if(bearerToken != null){
            if(!jwtUtil.isBearerTokenValid(bearerToken)){
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("text/plain;charset=UTF-8");
                response.getWriter().write("유효하지 않은 토큰(토큰이 있지만 유효하지 않음)");
                return;
            }

            String email = jwtUtil.getEmailFromBearerToken(bearerToken);

            // 이메일로 사용자 조회 (Optional 처리)
            User user = userRepository.findByEmail(email).orElse(null);

            // 사용자가 존재하지 않으면 401 에러 반환
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("text/plain;charset=UTF-8");
                response.getWriter().write("사용자를 찾을 수 없습니다. 다시 로그인해주세요.");
                return;
            }

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"))
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            request.setAttribute("userId", user.getId());
        }

        filterChain.doFilter(request, response);
    }
}
