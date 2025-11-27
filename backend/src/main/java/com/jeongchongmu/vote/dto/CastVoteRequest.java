package com.jeongchongmu.vote.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CastVoteRequest {

    @NotNull(message = "투표 옵션 ID는 필수입니다.")
    private Long optionId;

    public CastVoteRequest(Long optionId) {
        this.optionId = optionId;
    }
}