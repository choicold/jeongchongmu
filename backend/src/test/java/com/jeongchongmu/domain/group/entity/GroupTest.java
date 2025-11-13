package com.jeongchongmu.domain.group.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class GroupTest {

    @Test
    @DisplayName("그룹 정보 수정 비즈니스 로직 테스트")
    void updateGroupInfo() {
        // given (준비)
        Group group = Group.builder()
                .name("기존 이름")
                .description("기존 설명")
                .build();

        // when (실행)
        group.updateInfo("새로운 모임", "설명이 바뀌었습니다.");

        // then (검증)
        assertThat(group.getName()).isEqualTo("새로운 모임");
        assertThat(group.getDescription()).isEqualTo("설명이 바뀌었습니다.");
    }
}