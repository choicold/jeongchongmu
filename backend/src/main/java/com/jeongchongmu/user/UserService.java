package com.jeongchongmu.user;

import com.jeongchongmu.common.JwtUtil;
import com.jeongchongmu.user.dto.LoginRequestDto;
import com.jeongchongmu.user.dto.SignUpRequestDto;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public void signUp(SignUpRequestDto signUpRequestDto) {
        if(userRepository.findByEmail(signUpRequestDto.getEmail()).isPresent()){
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        String encodedPassword = passwordEncoder.encode(signUpRequestDto.getPassword());

        User user = User.builder()
                        .email(signUpRequestDto.getEmail())
                        .fcmToken("ex-token")
                        .bankName(signUpRequestDto.getBankName())
                        .accountNumber(signUpRequestDto.getAccountNumber())
                        .password(encodedPassword)
                        .name(signUpRequestDto.getName()).build();

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public String login(LoginRequestDto loginRequestDto) {
        User user = userRepository.findByEmail(loginRequestDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("등록된 이메일이 없습니다."));

        if(!passwordEncoder.matches(loginRequestDto.getPassword(), user.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String token = jwtUtil.createToken(user.getEmail());

        return token;
    }
}
