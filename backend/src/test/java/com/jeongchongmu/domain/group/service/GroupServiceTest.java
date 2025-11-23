package com.jeongchongmu.domain.group.service;

import com.jeongchongmu.domain.group.dto.GroupDto;
import com.jeongchongmu.domain.group.dto.GroupRequest;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.domain.group.repository.GroupRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GroupService 테스트")
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GroupService groupService;

    private User testUser;
    private Group testGroup;
    private GroupMember testGroupMember;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("홍길동")
                .email("hong@test.com")
                .build();

        testGroup = Group.builder()
                .id(1L)
                .name("제주도 여행")
                .description("2024년 가을 여행")
                .creator(testUser)
                .inviteCode("ABC12345")
                .build();

        testGroupMember = GroupMember.builder()
                .id(1L)
                .user(testUser)
                .group(testGroup)
                .role(Role.OWNER)
                .build();
    }

    @Nested
    @DisplayName("그룹 생성 테스트")
    class CreateGroupTest {

        @Test
        @DisplayName("Happy Path: 그룹 생성 성공")
        void createGroup_Success() {
            // given
            GroupRequest request = new GroupRequest("제주도 여행", "2024년 가을 여행");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupRepository.existsByInviteCode(anyString())).thenReturn(false);
            when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
            when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(testGroupMember);
            when(groupMemberRepository.countByGroup(any(Group.class))).thenReturn(1);

            // when
            GroupDto result = groupService.createGroup(1L, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.name()).isEqualTo("제주도 여행");
            assertThat(result.description()).isEqualTo("2024년 가을 여행");
            assertThat(result.inviteCode()).isNotBlank();
            assertThat(result.memberCount()).isEqualTo(1);

            verify(userRepository).findById(1L);
            verify(groupRepository).save(any(Group.class));
            verify(groupMemberRepository).save(any(GroupMember.class)); // OWNER 자동 추가
        }

        @Test
        @DisplayName("Edge Case: description이 null일 때")
        void createGroup_WithNullDescription() {
            // given
            GroupRequest request = new GroupRequest("제주도 여행", null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupRepository.existsByInviteCode(anyString())).thenReturn(false);
            when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
            when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(testGroupMember);
            when(groupMemberRepository.countByGroup(any(Group.class))).thenReturn(1);

            // when
            GroupDto result = groupService.createGroup(1L, request);

            // then
            assertThat(result).isNotNull();
            verify(groupRepository).save(any(Group.class));
        }

        @Test
        @DisplayName("Error Case: 존재하지 않는 사용자")
        void createGroup_UserNotFound() {
            // given
            GroupRequest request = new GroupRequest("제주도 여행", "설명");
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupService.createGroup(999L, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("사용자를 찾을 수 없습니다.");

            verify(groupRepository, never()).save(any());
        }

        @Test
        @DisplayName("Edge Case: 초대 코드 중복 시 재생성")
        void createGroup_DuplicateInviteCode() {
            // given
            GroupRequest request = new GroupRequest("제주도 여행", "설명");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            // 첫 번째는 중복, 두 번째는 중복 아님
            when(groupRepository.existsByInviteCode(anyString()))
                    .thenReturn(true)
                    .thenReturn(false);
            when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
            when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(testGroupMember);
            when(groupMemberRepository.countByGroup(any(Group.class))).thenReturn(1);

            // when
            GroupDto result = groupService.createGroup(1L, request);

            // then
            assertThat(result).isNotNull();
            verify(groupRepository, atLeast(2)).existsByInviteCode(anyString());
        }
    }

    @Nested
    @DisplayName("그룹 조회 테스트")
    class GetGroupTest {

        @Test
        @DisplayName("Happy Path: 그룹 조회 성공")
        void getGroup_Success() {
            // given
            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.countByGroup(testGroup)).thenReturn(5);

            // when
            GroupDto result = groupService.getGroup(1L);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("제주도 여행");
            assertThat(result.memberCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Error Case: 존재하지 않는 그룹")
        void getGroup_NotFound() {
            // given
            when(groupRepository.findById(999L)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupService.getGroup(999L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("그룹을 찾을 수 없습니다.");
        }
    }

    @Nested
    @DisplayName("내 그룹 목록 조회 테스트")
    class GetMyGroupsTest {

        @Test
        @DisplayName("Happy Path: 그룹 목록 조회 성공")
        void getMyGroups_Success() {
            // given
            Group group2 = Group.builder()
                    .id(2L)
                    .name("회식 정산")
                    .creator(testUser)
                    .inviteCode("XYZ67890")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupRepository.findAllGroupsByUser(testUser))
                    .thenReturn(List.of(testGroup, group2));
            when(groupMemberRepository.countByGroup(any())).thenReturn(3);

            // when
            List<GroupDto> result = groupService.getMyGroups(1L);

            // then
            assertThat(result).hasSize(2);
            assertThat(result).extracting("name")
                    .containsExactly("제주도 여행", "회식 정산");
        }

        @Test
        @DisplayName("Edge Case: 속한 그룹이 없는 경우")
        void getMyGroups_EmptyList() {
            // given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupRepository.findAllGroupsByUser(testUser)).thenReturn(List.of());

            // when
            List<GroupDto> result = groupService.getMyGroups(1L);

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Error Case: 존재하지 않는 사용자")
        void getMyGroups_UserNotFound() {
            // given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupService.getMyGroups(999L))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("그룹 수정 테스트")
    class UpdateGroupTest {

        @Test
        @DisplayName("Happy Path: 그룹 수정 성공 (OWNER)")
        void updateGroup_Success() {
            // given
            GroupRequest request = new GroupRequest("제주도 여행 (수정)", "수정된 설명");

            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, testUser))
                    .thenReturn(Optional.of(testGroupMember));
            when(groupMemberRepository.countByGroup(testGroup)).thenReturn(5);

            // when
            GroupDto result = groupService.updateGroup(1L, 1L, request);

            // then
            assertThat(result).isNotNull();
            verify(testGroup).updateInfo("제주도 여행 (수정)", "수정된 설명");
        }

        @Test
        @DisplayName("Error Case: MEMBER가 그룹 수정 시도")
        void updateGroup_Forbidden() {
            // given
            User memberUser = User.builder().id(2L).name("김철수").build();
            GroupMember member = GroupMember.builder()
                    .user(memberUser)
                    .group(testGroup)
                    .role(Role.MEMBER)
                    .build();

            GroupRequest request = new GroupRequest("수정", "시도");

            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(memberUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, memberUser))
                    .thenReturn(Optional.of(member));

            // when & then
            assertThatThrownBy(() -> groupService.updateGroup(1L, 2L, request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("그룹 OWNER만 수행할 수 있는 기능입니다.");
        }

        @Test
        @DisplayName("Error Case: 그룹 멤버가 아닌 사용자")
        void updateGroup_NotMember() {
            // given
            User otherUser = User.builder().id(3L).name("이영희").build();
            GroupRequest request = new GroupRequest("수정", "시도");

            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(3L)).thenReturn(Optional.of(otherUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, otherUser))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupService.updateGroup(1L, 3L, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("그룹 멤버가 아닙니다.");
        }
    }

    @Nested
    @DisplayName("그룹 삭제 테스트")
    class DeleteGroupTest {

        @Test
        @DisplayName("Happy Path: 그룹 삭제 성공 (OWNER)")
        void deleteGroup_Success() {
            // given
            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, testUser))
                    .thenReturn(Optional.of(testGroupMember));

            // when
            groupService.deleteGroup(1L, 1L);

            // then
            verify(groupRepository).delete(testGroup);
        }

        @Test
        @DisplayName("Error Case: MEMBER가 그룹 삭제 시도")
        void deleteGroup_Forbidden() {
            // given
            User memberUser = User.builder().id(2L).name("김철수").build();
            GroupMember member = GroupMember.builder()
                    .user(memberUser)
                    .group(testGroup)
                    .role(Role.MEMBER)
                    .build();

            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(memberUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, memberUser))
                    .thenReturn(Optional.of(member));

            // when & then
            assertThatThrownBy(() -> groupService.deleteGroup(1L, 2L))
                    .isInstanceOf(AccessDeniedException.class);

            verify(groupRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("초대 코드 재생성 테스트")
    class RegenerateInviteCodeTest {

        @Test
        @DisplayName("Happy Path: 초대 코드 재생성 성공")
        void regenerateInviteCode_Success() {
            // given
            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, testUser))
                    .thenReturn(Optional.of(testGroupMember));
            when(groupRepository.existsByInviteCode(anyString())).thenReturn(false);
            when(groupMemberRepository.countByGroup(testGroup)).thenReturn(5);

            String oldCode = testGroup.getInviteCode();

            // when
            GroupDto result = groupService.regenerateInviteCode(1L, 1L);

            // then
            assertThat(result).isNotNull();
            verify(testGroup).regenerateInviteCode(anyString());
        }

        @Test
        @DisplayName("Error Case: MEMBER가 초대 코드 재생성 시도")
        void regenerateInviteCode_Forbidden() {
            // given
            User memberUser = User.builder().id(2L).name("김철수").build();
            GroupMember member = GroupMember.builder()
                    .user(memberUser)
                    .group(testGroup)
                    .role(Role.MEMBER)
                    .build();

            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(2L)).thenReturn(Optional.of(memberUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, memberUser))
                    .thenReturn(Optional.of(member));

            // when & then
            assertThatThrownBy(() -> groupService.regenerateInviteCode(1L, 2L))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }
}