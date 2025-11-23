package com.jeongchongmu.domain.group.repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest // JPA 관련 컴포넌트만 로드하여 테스트
class GroupRepositoryTest {

    @Autowired GroupRepository groupRepository;
    @Autowired GroupMemberRepository groupMemberRepository;
    @Autowired UserRepository userRepository; // 테스트 데이터 생성을 위해 필요

    @Test
    @DisplayName("내가 만든 그룹과 내가 멤버로 참여한 그룹이 모두 조회되어야 한다")
    void findAllGroupsByUser() {
        // 1. 유저 2명 생성 (나, 남)
        User me = userRepository.save(User.builder().email("me@test.com").password("pw").name("나").build());
        User other = userRepository.save(User.builder().email("other@test.com").password("pw").name("남").build());

        // 2. 그룹 생성 상황 세팅
        // A. 내가 만든 그룹 (나는 Creator)
        Group myGroup = groupRepository.save(Group.builder().name("내 그룹").creator(me).build());

        // B. 남이 만들고, 내가 멤버로 들어간 그룹
        Group joinedGroup = groupRepository.save(Group.builder().name("참여 그룹").creator(other).build());
        groupMemberRepository.save(GroupMember.builder().group(joinedGroup).user(me).role(Role.MEMBER).build());

        // C. 남이 만들고, 나는 상관없는 그룹
        Group otherGroup = groupRepository.save(Group.builder().name("남의 그룹").creator(other).build());

        // 3. 조회 실행
        List<Group> result = groupRepository.findAllGroupsByUser(me);

        // 4. 검증
        assertThat(result).hasSize(2); // 내 그룹 + 참여 그룹 = 2개
        assertThat(result).extracting("name")
                .containsExactlyInAnyOrder("내 그룹", "참여 그룹");

        assertThat(result).extracting("name")
                .doesNotContain("남의 그룹");
    }

    @Test
    @DisplayName("그룹 이름으로 검색이 되어야 한다")
    void searchByName() {
        // given
        User user = userRepository.save(User.builder().email("a@a.com").password("p").name("n").build());
        groupRepository.save(Group.builder().name("제주도 여행").creator(user).build());
        groupRepository.save(Group.builder().name("서울 맛집").creator(user).build());

        // when
        List<Group> result = groupRepository.findByNameContaining("제주");

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("제주도 여행");
    }
}