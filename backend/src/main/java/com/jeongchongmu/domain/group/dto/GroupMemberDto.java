package com.jeongchongmu.domain.group.dto;

import com.jeongchongmu.domain.group.entity.Role;

import java.time.LocalDateTime;

public record GroupMemberDto(
        Long id,                // GroupMember의 id
        Long groupId,           // 그룹 ID
        UserSummaryDto user,    // 그룹 멤버의 정보
        Role role,              // 그룹 멤버의 역할(OWNER/MEMBER)
        LocalDateTime joinedAt  // 그룹 참여 시간
) {}
