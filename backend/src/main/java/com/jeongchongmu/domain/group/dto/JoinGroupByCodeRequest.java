package com.jeongchongmu.domain.group.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinGroupByCodeRequest(
        @NotBlank String inviteCode
        // userId는 로그인 정보에서 groupId는 InviteCode에서 조회해서 찾으면 됨
) {}
