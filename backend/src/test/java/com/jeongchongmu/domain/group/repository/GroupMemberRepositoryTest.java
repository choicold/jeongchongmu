package com.jeongchongmu.domain.group.repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
class GroupMemberRepositoryTest {

    @Autowired GroupMemberRepository groupMemberRepository;
    @Autowired GroupRepository groupRepository;
    @Autowired UserRepository userRepository;

    User user1, user2, user3;
    Group groupA, groupB;

    @BeforeEach
    void setUp() {
        // 1. 유저 3명 생성
        user1 = userRepository.save(User.builder().email("u1@test.com").password("pw").name("지성").build());
        user2 = userRepository.save(User.builder().email("u2@test.com").password("pw").name("경환").build());
        user3 = userRepository.save(User.builder().email("u3@test.com").password("pw").name("선용").build());

        // 2. 그룹 2개 생성
        groupA = groupRepository.save(Group.builder().name("밥먹자모임").creator(user1).build());
        groupB = groupRepository.save(Group.builder().name("캡스톤모임").creator(user2).build());

        // 3. 멤버십 세팅 (데이터 준비)
        // groupA (밥먹자모임): 지성(OWNER), 경환(MEMBER)
        groupMemberRepository.save(GroupMember.builder().group(groupA).user(user1).role(Role.OWNER).build());
        groupMemberRepository.save(GroupMember.builder().group(groupA).user(user2).role(Role.MEMBER).build());

        // groupB (캡스톤모임): 경환(OWNER), 지성(MEMBER)
        groupMemberRepository.save(GroupMember.builder().group(groupB).user(user2).role(Role.OWNER).build());
        groupMemberRepository.save(GroupMember.builder().group(groupB).user(user1).role(Role.MEMBER).build());
    }

    @Test
    @DisplayName("1. 특정 그룹의 모든 멤버 조회 (findByGroup)")
    void findByGroup() {
        // when: 밥먹자모임(groupA)의 멤버 조회
        List<GroupMember> members = groupMemberRepository.findByGroup(groupA);

        // then: 지성, 경환 2명이 나와야 함
        assertThat(members).hasSize(2);
        assertThat(members).extracting("user.name")
                .containsExactlyInAnyOrder("지성", "경환");
    }

    @Test
    @DisplayName("2. 특정 유저가 속한 그룹 목록 조회 (findByUser)")
    void findByUser() {
        // when: 지성이가 가입한 모임 조회
        List<GroupMember> memberships = groupMemberRepository.findByUser(user1);

        // then: 밥먹자모임, 캡스톤모임 2개 다 나와야 함
        assertThat(memberships).hasSize(2);
        assertThat(memberships).extracting("group.name")
                .containsExactlyInAnyOrder("밥먹자모임", "캡스톤모임");
    }

    @Test
    @DisplayName("3. 특정 유저가 그룹 멤버인지 확인 (existsByUserAndGroup)")
    void existsByUserAndGroup() {
        // given: 선용이는 아직 아무데도 가입 안 함

        // when & then
        boolean isMember = groupMemberRepository.existsByUserAndGroup(user1, groupA); // 지성이는 밥먹자모임 멤버?
        boolean isNotMember = groupMemberRepository.existsByUserAndGroup(user3, groupA); // 선용이는 밥먹자모임 멤버?

        assertThat(isMember).isTrue();
        assertThat(isNotMember).isFalse();
    }

    @Test
    @DisplayName("4. 특정 그룹의 특정 멤버 정보 조회 (findByGroupAndUser)")
    void findByGroupAndUser() {
        // when: 밥먹자모임에서 영희 찾기
        Optional<GroupMember> member = groupMemberRepository.findByGroupAndUser(groupA, user2);

        // then
        assertThat(member).isPresent();
        assertThat(member.get().getUser().getName()).isEqualTo("경환");
        assertThat(member.get().getRole()).isEqualTo(Role.MEMBER);
    }

    @Test
    @DisplayName("5. 특정 그룹의 OWNER 조회 (findByGroupAndRole)")
    void findByGroupAndRole_Owner() {
        // when: 밥먹자모임의 방장 찾기
        Optional<GroupMember> owner = groupMemberRepository.findByGroupAndRole(groupA, Role.OWNER);

        // then
        assertThat(owner).isPresent();
        assertThat(owner.get().getUser().getName()).isEqualTo("지성");
    }

    @Test
    @DisplayName("6. 특정 그룹의 MEMBER 목록 조회 (findAllByGroupAndRole)")
    void findAllByGroupAndRole_Member() {
        // when: 밥먹자모임의 일반 멤버만 조회 (방장 제외)
        List<GroupMember> members = groupMemberRepository.findAllByGroupAndRole(groupA, Role.MEMBER);

        // then: 경환 1명만 나와야 함 (지성이는 OWNER니까)
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getUser().getName()).isEqualTo("경환");
    }

    @Test
    @DisplayName("7. 특정 그룹의 총 멤버 수 (countByGroup)")
    void countByGroup() {
        // when
        long count = groupMemberRepository.countByGroup(groupA);

        // then
        assertThat(count).isEqualTo(2); // 지성 + 경환
    }

    @Test
    @DisplayName("8. 특정 그룹에서 유저 삭제 (deleteByGroupAndUser)")
    void deleteByGroupAndUser() {
        // given: 삭제 전엔 2명
        assertThat(groupMemberRepository.countByGroup(groupA)).isEqualTo(2);

        // when: 경환를 밥먹자모임에서 강퇴
        groupMemberRepository.deleteByGroupAndUser(groupA, user2);

        // then
        long afterCount = groupMemberRepository.countByGroup(groupA);
        boolean exists = groupMemberRepository.existsByUserAndGroup(user2, groupA);

        assertThat(afterCount).isEqualTo(1); // 1명 남음
        assertThat(exists).isFalse(); // 경환이는 더 이상 멤버가 아님
    }
}