package com.jeongchongmu.user.dto;

import lombok.Getter;

@Getter
public class LoginResponseDto {
    private String bearerToken;

    public LoginResponseDto(String bearerToken) {
        this.bearerToken = bearerToken;
    }

}
