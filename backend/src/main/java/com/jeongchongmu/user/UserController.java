package com.jeongchongmu.user;


import com.jeongchongmu.user.dto.FcmTokenRequestDto;
import com.jeongchongmu.user.dto.LoginRequestDto;
import com.jeongchongmu.user.dto.LoginResponseDto;
import com.jeongchongmu.user.dto.SignUpRequestDto;
import com.jeongchongmu.user.dto.UserProfileResponseDto;
import com.jeongchongmu.user.dto.UserUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RequestMapping("/api/user")
@RestController
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<String> signUp(@Valid @RequestBody SignUpRequestDto signUpRequestDto){
        userService.signUp(signUpRequestDto);

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto){
        LoginResponseDto response = userService.login(loginRequestDto);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<String> test(){
        return ResponseEntity.ok("테스트 성공입니다.");
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponseDto> getProfile(@AuthenticationPrincipal User user) {
        UserProfileResponseDto profile = userService.getUserProfile(user);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponseDto> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserUpdateRequestDto updateRequestDto) {
        UserProfileResponseDto updatedProfile = userService.updateUserProfile(user, updateRequestDto);
        return ResponseEntity.ok(updatedProfile);
    }

    /**
     * FCM 토큰 등록/업데이트
     * 앱에서 생성된 FCM 토큰을 서버에 저장합니다.
     *
     * @param user 현재 로그인한 사용자
     * @param request FCM 토큰 요청 DTO
     * @return 성공 메시지
     */
    @PostMapping("/fcm-token")
    public ResponseEntity<String> updateFcmToken(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody FcmTokenRequestDto request) {
        userService.updateFcmToken(user, request.getFcmToken());
        return ResponseEntity.ok("FCM 토큰이 등록되었습니다.");
    }

    /**
     * FCM 토큰 삭제
     * 로그아웃 시 FCM 토큰을 삭제합니다.
     *
     * @param user 현재 로그인한 사용자
     * @return 성공 메시지
     */
    @DeleteMapping("/fcm-token")
    public ResponseEntity<String> deleteFcmToken(@AuthenticationPrincipal User user) {
        userService.deleteFcmToken(user);
        return ResponseEntity.ok("FCM 토큰이 삭제되었습니다.");
    }

    /**
     * 로그아웃
     * FCM 토큰을 삭제하고 로그아웃을 처리합니다.
     * 클라이언트는 로컬 토큰을 삭제해야 합니다.
     *
     * @param user 현재 로그인한 사용자
     * @return 성공 메시지
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal User user) {
        userService.logout(user);
        return ResponseEntity.ok("로그아웃되었습니다.");
    }

}
