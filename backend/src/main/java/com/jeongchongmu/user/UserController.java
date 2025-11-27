package com.jeongchongmu.user;


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
        String token = userService.login(loginRequestDto);

        return ResponseEntity.ok(new LoginResponseDto(token));
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

}
