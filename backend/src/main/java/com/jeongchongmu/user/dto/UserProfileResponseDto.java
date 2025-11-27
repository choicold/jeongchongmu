package com.jeongchongmu.user.dto;

import com.jeongchongmu.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserProfileResponseDto {
    private Long id;
    private String email;
    private String name;
    private String bankName;
    private String accountNumber;

    public static UserProfileResponseDto from(User user) {
        return new UserProfileResponseDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBankName(),
                user.getAccountNumber()
        );
    }
}
