package com.jeongchongmu.vote.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class ExtendVoteRequest {

    @NotNull(message = "새 마감 시간은 필수입니다.")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime newCloseAt;

    public ExtendVoteRequest(LocalDateTime newCloseAt) {
        this.newCloseAt = newCloseAt;
    }
}