package com.jeongchongmu.common;

import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        log.debug("=== 요청 들어옴: {} {}", request.getMethod(), request.getRequestURI());

        String bearerToken = jwtUtil.getBearerTokenFromHeader(request);

        if(bearerToken != null){
            if(!jwtUtil.isBearerTokenValid(bearerToken)){
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("text/plain;charset=UTF-8");
                response.getWriter().write("유효하지 않은 토큰(토큰이 있지만 유효하지 않음)");
                return;
            }

            String email = jwtUtil.getEmailFromBearerToken(bearerToken);
            User user = userRepository.findByEmail(email).get();

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

    /**
     * ✅ 비동기 요청(SSE 스트리밍 등)에서도 이 필터를 적용하도록 설정
     * false를 반환하면 비동기 디스패치에서도 필터가 실행됨
     */
    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;
    }

    /**
     * ✅ 에러 디스패치에서도 이 필터를 적용하도록 설정
     * false를 반환하면 에러 처리 시에도 필터가 실행됨
     */
    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }
}
