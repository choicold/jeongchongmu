package com.jeongchongmu.domain.group.service;

import com.jeongchongmu.domain.group.dto.GroupMemberDto;
import com.jeongchongmu.domain.group.dto.UserSummaryDto;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.domain.group.repository.GroupRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/*
 * GroupMemberService가 제공하는 기능
 * 1. 초대 코드로 멤버 추가
 * 2. 멤버 목록 조회
 * 3. 멤버 삭제
 * 4. 멤버 권한 변경 => 이건 아직 구현 안됨
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class GroupMemberService {
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    // 초대 코드로 그룹에 참여
    @Transactional
    public GroupMemberDto joinGroupByInviteCode(Long userId, String inviteCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        Group group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new EntityNotFoundException("유효하지 않은 초대 코드입니다."));

        if(groupMemberRepository.existsByUserAndGroup(user, group)) {
            throw new IllegalStateException("이미 그룹에 참여되어 있습니다.");
        }

        GroupMember newMember = GroupMember.builder()
                .user(user)
                .group(group)
                .role(Role.MEMBER)
                .build();

        GroupMember savedMember = groupMemberRepository.save(newMember);

        return toGroupMemberDto(savedMember);
    }

    // 그룹 멤버 목록 조회
    public List<GroupMemberDto> getGroupMembers(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));

        List<GroupMember> members = groupMemberRepository.findByGroup(group);

        return members.stream()
                .map(this::toGroupMemberDto)
                .toList();
    }

    // 특정 멤버 조회
    public GroupMemberDto getGroupMember(Long groupId, Long memberId) {
        GroupMember member = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("멤버를 찾을 수 없습니다."));

        if(!member.getGroup().getId().equals(groupId)) {
            throw new IllegalStateException("해당 그룹의 멤버가 아닙니다.");
        }

        return toGroupMemberDto(member);
    }

    // 멤버 강제 퇴출(OWNER만 가능)
    @Transactional
    public void removeMember(Long groupId, Long requesterId, Long targetUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));
        validateOwnerPermission(group, requesterId);

        // OWNER 자기 자신은 퇴출 불가
        if(requesterId.equals(targetUserId)) {
            throw new IllegalStateException("그룹 OWNER는 스스로 퇴출할 수 없습니다.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        GroupMember targetMember = groupMemberRepository.findByGroupAndUser(group, targetUser)
                .orElseThrow(() -> new EntityNotFoundException("해당 사용자는 그룹 멤버가 아닙니다."));

        groupMemberRepository.delete(targetMember);
    }

    // 멤버 스스로 자진 탈퇴
    @Transactional
    public void leaveGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new EntityNotFoundException("해당 사용자는 그룹 멤버가 아닙니다."));

        // OWNER는 탈퇴 불가
        if(member.getRole() == Role.OWNER) {
            throw new IllegalStateException("그룹 OWNER는 스스로 탈퇴할 수 없습니다. 그룹을 삭제해주세요.");
        }

        groupMemberRepository.delete(member);
    }

    // OWNER만 수행 가능한 기능을 사용하기 앞서 권한 검증
    private void validateOwnerPermission(Group group, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new EntityNotFoundException("그룹 멤버가 아닙니다."));

        if(member.getRole() != Role.OWNER) {
            throw new AccessDeniedException("그룹 OWNER만 수행할 수 있는 기능입니다.");
        }
    }
    private GroupMemberDto toGroupMemberDto(GroupMember member) {
        return new GroupMemberDto(
                member.getId(),
                new UserSummaryDto(member.getUser().getId(), member.getUser().getName()),
                member.getRole(),
                member.getCreatedAt()
        );
    }
}
