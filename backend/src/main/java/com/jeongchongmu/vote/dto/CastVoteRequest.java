package com.jeongchongmu.vote.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CastVoteRequest {
    private Long userId;
    private Long optionId;
}