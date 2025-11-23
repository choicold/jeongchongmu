package com.jeongchongmu.domain.group.service;

import com.jeongchongmu.domain.group.dto.GroupMemberDto;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GroupMemberService 테스트")
class GroupMemberServiceTest {

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GroupMemberService groupMemberService;

    private User ownerUser;
    private User memberUser;
    private User newUser;
    private Group testGroup;
    private GroupMember ownerMember;
    private GroupMember normalMember;

    @BeforeEach
    void setUp() {
        ownerUser = User.builder()
                .id(1L)
                .name("홍길동")
                .email("hong@test.com")
                .password("test1234")
                .build();

        memberUser = User.builder()
                .id(2L)
                .name("김철수")
                .email("kim@test.com")
                .password("test1234")
                .build();

        newUser = User.builder()
                .id(3L)
                .name("이영희")
                .email("lee@test.com")
                .password("test1234")
                .build();

        testGroup = Group.builder()
                .id(1L)
                .name("제주도 여행")
                .creator(ownerUser)
                .inviteCode("ABC12345")
                .build();

        ownerMember = GroupMember.builder()
                .id(1L)
                .user(ownerUser)
                .group(testGroup)
                .role(Role.OWNER)
                .build();

        normalMember = GroupMember.builder()
                .id(2L)
                .user(memberUser)
                .group(testGroup)
                .role(Role.MEMBER)
                .build();
    }

    @Nested
    @DisplayName("초대 코드로 그룹 참여 테스트")
    class JoinGroupByInviteCodeTest {

        @Test
        @DisplayName("Happy Path: 그룹 참여 성공")
        void joinGroup_Success() {
            // given
            String inviteCode = testGroup.getInviteCode();
            GroupMember newMember = GroupMember.builder()
                    .id(3L)
                    .user(newUser)
                    .group(testGroup)
                    .role(Role.MEMBER)
                    .build();

            when(userRepository.findById(newUser.getId())).thenReturn(Optional.of(newUser));
            when(groupRepository.findByInviteCode(inviteCode)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.existsByUserAndGroup(newUser, testGroup)).thenReturn(false);
            when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(newMember);

            // when
            GroupMemberDto result = groupMemberService.joinGroupByInviteCode(newUser.getId(), inviteCode);

            // then
            ArgumentCaptor<GroupMember> memberCaptor = ArgumentCaptor.forClass(GroupMember.class);
            verify(groupMemberRepository).save(memberCaptor.capture());

            GroupMember savedMember = memberCaptor.getValue();
            assertThat(savedMember.getUser()).isEqualTo(newUser);
            assertThat(savedMember.getGroup()).isEqualTo(testGroup);
            assertThat(savedMember.getRole()).isEqualTo(Role.MEMBER); // 정확한 Role 검증

            assertThat(result).isNotNull();
            assertThat(result.user().id()).isEqualTo(newUser.getId());
            assertThat(result.role()).isEqualTo(Role.MEMBER);
        }

        @Test
        @DisplayName("Error Case: 유효하지 않은 초대 코드")
        void joinGroup_InvalidInviteCode() {
            // given
            String invalidCode = "INVALID";
            when(userRepository.findById(newUser.getId())).thenReturn(Optional.of(newUser));
            when(groupRepository.findByInviteCode(invalidCode)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupMemberService.joinGroupByInviteCode(newUser.getId(), invalidCode))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("유효하지 않은 초대 코드입니다.");

            verify(groupMemberRepository, never()).save(any());
        }

        @Test
        @DisplayName("Error Case: 이미 그룹에 참여한 사용자")
        void joinGroup_AlreadyMember() {
            // given
            String inviteCode = testGroup.getInviteCode();
            when(userRepository.findById(memberUser.getId())).thenReturn(Optional.of(memberUser));
            when(groupRepository.findByInviteCode(inviteCode)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.existsByUserAndGroup(memberUser, testGroup)).thenReturn(true);

            // when & then
            assertThatThrownBy(() -> groupMemberService.joinGroupByInviteCode(memberUser.getId(), inviteCode))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("이미 그룹에 참여되어 있습니다.");

            verify(groupMemberRepository, never()).save(any());
        }

        @Test
        @DisplayName("Error Case: 존재하지 않는 사용자")
        void joinGroup_UserNotFound() {
            // given
            Long nonExistentUserId = 999L;
            when(userRepository.findById(nonExistentUserId)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupMemberService.joinGroupByInviteCode(nonExistentUserId, testGroup.getInviteCode()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("사용자를 찾을 수 없습니다.");
        }
    }

    @Nested
    @DisplayName("그룹 멤버 목록 조회 테스트")
    class GetGroupMembersTest {

        @Test
        @DisplayName("Happy Path: 멤버 목록 조회 성공")
        void getGroupMembers_Success() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroup(testGroup))
                    .thenReturn(List.of(ownerMember, normalMember));

            // when
            List<GroupMemberDto> result = groupMemberService.getGroupMembers(testGroup.getId());

            // then
            assertThat(result).hasSize(2);
            assertThat(result).extracting("role")
                    .containsExactly(Role.OWNER, Role.MEMBER);
        }

        @Test
        @DisplayName("Edge Case: 멤버가 OWNER만 있는 경우")
        void getGroupMembers_OnlyOwner() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroup(testGroup))
                    .thenReturn(List.of(ownerMember));

            // when
            List<GroupMemberDto> result = groupMemberService.getGroupMembers(testGroup.getId());

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).role()).isEqualTo(Role.OWNER);
        }

        @Test
        @DisplayName("Error Case: 존재하지 않는 그룹")
        void getGroupMembers_GroupNotFound() {
            // given
            Long nonExistentGroupId = 999L;
            when(groupRepository.findById(nonExistentGroupId)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupMemberService.getGroupMembers(nonExistentGroupId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("특정 멤버 조회 테스트")
    class GetGroupMemberTest {

        @Test
        @DisplayName("Happy Path: 멤버 조회 성공")
        void getGroupMember_Success() {
            // given
            when(groupMemberRepository.findById(normalMember.getId())).thenReturn(Optional.of(normalMember));

            // when
            GroupMemberDto result = groupMemberService.getGroupMember(testGroup.getId(), normalMember.getId());

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(normalMember.getId());
            assertThat(result.role()).isEqualTo(Role.MEMBER);
        }

        @Test
        @DisplayName("Error Case: 존재하지 않는 멤버")
        void getGroupMember_NotFound() {
            // given
            Long nonExistentMemberId = 999L;
            when(groupMemberRepository.findById(nonExistentMemberId)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupMemberService.getGroupMember(testGroup.getId(), nonExistentMemberId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Error Case: 다른 그룹의 멤버")
        void getGroupMember_WrongGroup() {
            // given
            Group otherGroup = Group.builder().id(2L).build();
            GroupMember otherGroupMember = GroupMember.builder()
                    .id(5L)
                    .group(otherGroup)
                    .user(memberUser)
                    .role(Role.MEMBER)
                    .build();

            when(groupMemberRepository.findById(otherGroupMember.getId())).thenReturn(Optional.of(otherGroupMember));

            // when & then
            // testGroup.getId() (1L)와 otherGroupMember의 그룹 ID (2L)가 다름
            assertThatThrownBy(() -> groupMemberService.getGroupMember(testGroup.getId(), otherGroupMember.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("해당 그룹의 멤버가 아닙니다.");
        }
    }

    @Nested
    @DisplayName("멤버 강제 퇴출 테스트")
    class RemoveMemberTest {

        @Test
        @DisplayName("Happy Path: 멤버 강제 퇴출 성공 (OWNER가 MEMBER 퇴출)")
        void removeMember_Success() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(ownerUser.getId())).thenReturn(Optional.of(ownerUser));
            when(userRepository.findById(memberUser.getId())).thenReturn(Optional.of(memberUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, ownerUser))
                    .thenReturn(Optional.of(ownerMember));
            when(groupMemberRepository.findByGroupAndUser(testGroup, memberUser))
                    .thenReturn(Optional.of(normalMember));

            // when
            groupMemberService.removeMember(testGroup.getId(), ownerUser.getId(), memberUser.getId());

            // then
            verify(groupMemberRepository).delete(normalMember);
        }

        @Test
        @DisplayName("Error Case: OWNER가 자기 자신 퇴출 시도")
        void removeMember_RemoveSelf() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(ownerUser.getId())).thenReturn(Optional.of(ownerUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, ownerUser))
                    .thenReturn(Optional.of(ownerMember));

            // when & then
            assertThatThrownBy(() -> groupMemberService.removeMember(testGroup.getId(), ownerUser.getId(), ownerUser.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("그룹 OWNER는 스스로 퇴출할 수 없습니다.");

            verify(groupMemberRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Error Case: MEMBER가 다른 멤버 퇴출 시도")
        void removeMember_Forbidden() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(memberUser.getId())).thenReturn(Optional.of(memberUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, memberUser))
                    .thenReturn(Optional.of(normalMember));

            // when & then
            assertThatThrownBy(() -> groupMemberService.removeMember(testGroup.getId(), memberUser.getId(), newUser.getId()))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("그룹 OWNER만 수행할 수 있는 기능입니다.");

            verify(groupMemberRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Error Case: 그룹에 없는 사용자 퇴출 시도")
        void removeMember_TargetNotMember() {
            // given
            Long targetUserId = 999L;
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(ownerUser.getId())).thenReturn(Optional.of(ownerUser));
            when(userRepository.findById(targetUserId)).thenReturn(Optional.of(newUser)); // newUser 객체 재사용
            when(groupMemberRepository.findByGroupAndUser(testGroup, ownerUser))
                    .thenReturn(Optional.of(ownerMember));
            when(groupMemberRepository.findByGroupAndUser(testGroup, newUser))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupMemberService.removeMember(testGroup.getId(), ownerUser.getId(), targetUserId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("해당 사용자는 그룹 멤버가 아닙니다.");
        }
    }

    @Nested
    @DisplayName("자진 탈퇴 테스트")
    class LeaveGroupTest {

        @Test
        @DisplayName("Happy Path: MEMBER 자진 탈퇴 성공")
        void leaveGroup_Success() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(memberUser.getId())).thenReturn(Optional.of(memberUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, memberUser))
                    .thenReturn(Optional.of(normalMember));

            // when
            groupMemberService.leaveGroup(testGroup.getId(), memberUser.getId());

            // then
            verify(groupMemberRepository).delete(normalMember);
        }

        @Test
        @DisplayName("Error Case: OWNER가 탈퇴 시도")
        void leaveGroup_OwnerCannotLeave() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(ownerUser.getId())).thenReturn(Optional.of(ownerUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, ownerUser))
                    .thenReturn(Optional.of(ownerMember));

            // when & then
            assertThatThrownBy(() -> groupMemberService.leaveGroup(testGroup.getId(), ownerUser.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("그룹 OWNER는 스스로 탈퇴할 수 없습니다. 그룹을 삭제해주세요.");

            verify(groupMemberRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Error Case: 그룹 멤버가 아닌 사용자가 탈퇴 시도")
        void leaveGroup_NotMember() {
            // given
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(newUser.getId())).thenReturn(Optional.of(newUser));
            when(groupMemberRepository.findByGroupAndUser(testGroup, newUser))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupMemberService.leaveGroup(testGroup.getId(), newUser.getId()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("해당 사용자는 그룹 멤버가 아닙니다.");
        }
    }
}