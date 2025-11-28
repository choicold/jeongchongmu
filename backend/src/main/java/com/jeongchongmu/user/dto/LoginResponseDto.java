package com.jeongchongmu.user.dto;

import com.jeongchongmu.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDto {
    private String bearerToken;
    private Long id;
    private String email;
    private String name;
    private String bankName;
    private String accountNumber;

    public static LoginResponseDto of(String token, User user) {
        return new LoginResponseDto(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBankName(),
                user.getAccountNumber()
        );
    }
}
