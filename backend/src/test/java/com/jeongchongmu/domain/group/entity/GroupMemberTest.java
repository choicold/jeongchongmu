package com.jeongchongmu.domain.group.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class GroupMemberTest {

    @Test
    @DisplayName("멤버 역할 변경 테스트")
    void changeRole() {
        // given
        GroupMember member = GroupMember.builder()
                .role(Role.MEMBER) // 처음엔 일반 멤버
                .build();

        // when
        member.changeRole(Role.OWNER); // 관리자로 승격

        // then
        assertThat(member.getRole()).isEqualTo(Role.OWNER);
    }
}