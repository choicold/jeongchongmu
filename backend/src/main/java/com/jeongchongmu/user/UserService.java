package com.jeongchongmu.user;

import com.jeongchongmu.common.JwtUtil;
import com.jeongchongmu.user.dto.LoginRequestDto;
import com.jeongchongmu.user.dto.LoginResponseDto;
import com.jeongchongmu.user.dto.SignUpRequestDto;
import com.jeongchongmu.user.dto.UserProfileResponseDto;
import com.jeongchongmu.user.dto.UserUpdateRequestDto;
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
                        .fcmToken(null)  // 회원가입 시 fcmToken은 null로 설정
                        .bankName(signUpRequestDto.getBankName())
                        .accountNumber(signUpRequestDto.getAccountNumber())
                        .password(encodedPassword)
                        .name(signUpRequestDto.getName()).build();

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        User user = userRepository.findByEmail(loginRequestDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("등록된 이메일이 없습니다."));

        if(!passwordEncoder.matches(loginRequestDto.getPassword(), user.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String token = jwtUtil.createToken(user.getEmail());

        return LoginResponseDto.of(token, user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDto getUserProfile(User user) {
        return UserProfileResponseDto.from(user);
    }

    @Transactional
    public UserProfileResponseDto updateUserProfile(User user, UserUpdateRequestDto updateRequestDto) {
        User foundUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        foundUser.updateProfile(updateRequestDto.getName(), updateRequestDto.getBankName(), updateRequestDto.getAccountNumber());

        return UserProfileResponseDto.from(foundUser);
    }

    /**
     * FCM 토큰 등록/업데이트
     * 사용자의 FCM 토큰을 저장하거나 업데이트합니다.
     *
     * @param user 로그인한 사용자
     * @param fcmToken FCM 토큰
     */
    @Transactional
    public void updateFcmToken(User user, String fcmToken) {
        User foundUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        foundUser.updateFcmToken(fcmToken);
        userRepository.save(foundUser);
    }

    /**
     * FCM 토큰 삭제
     * 로그아웃 시 FCM 토큰을 삭제합니다.
     *
     * @param user 로그인한 사용자
     */
    @Transactional
    public void deleteFcmToken(User user) {
        User foundUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        foundUser.updateFcmToken(null);
        userRepository.save(foundUser);
    }

    /**
     * 로그아웃
     * FCM 토큰을 삭제하고 로그아웃을 처리합니다.
     * JWT는 stateless이므로 서버에서 토큰을 무효화할 수 없습니다.
     * 클라이언트에서 토큰을 삭제해야 합니다.
     *
     * @param user 로그인한 사용자
     */
    @Transactional
    public void logout(User user) {
        // FCM 토큰 삭제
        deleteFcmToken(user);

        // JWT는 stateless이므로 서버에서 별도로 할 작업이 없습니다.
        // 필요 시 여기에 로그아웃 로그 기록 등을 추가할 수 있습니다.
    }
}
