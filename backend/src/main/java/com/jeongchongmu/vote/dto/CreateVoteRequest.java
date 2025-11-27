package com.jeongchongmu.vote.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CreateVoteRequest {

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime closeAt;  // null이면 기본 24시간

    public CreateVoteRequest(LocalDateTime closeAt) {
        this.closeAt = closeAt;
    }
}