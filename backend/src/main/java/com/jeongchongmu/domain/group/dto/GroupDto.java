package com.jeongchongmu.domain.group.dto;

import java.time.LocalDateTime;

public record GroupDto(
        Long id,                // 그룹 id
        String name,            // 그룹 이름
        String description,     // 그룹 설명
        String icon,            // 그룹 아이콘 (이모지)
        String inviteCode,      // 그룹 초대 코드
        String inviteLink,      // 그룹 초대 링크 => 이거 아직 안됩니다. 따로 Controller를 만들어야 해서 시간 좀 걸려요.
        UserSummaryDto creator, // 그룹 생성자 정보
        int memberCount,        // 현재 그룹 멤버 수
        LocalDateTime createdAt // 그룹 생성일
        // 그룹 멤버의 정보는 N+1 문제를 야기할 수 있어, GroupMemberDTO를 따로 분리하였으니 이점 참고 바랍니다.
) {}
