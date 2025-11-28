package com.jeongchongmu.domain.group.dto;

import jakarta.validation.constraints.NotBlank;

// 그룹을 처음 생성할 때 또는 수정할 것이 있을 때 사용
public record GroupRequest(
        @NotBlank
        String name,
        String description,
        String icon
        // creatorId는 로그인 정보에서 찾으면 됨
) {}
