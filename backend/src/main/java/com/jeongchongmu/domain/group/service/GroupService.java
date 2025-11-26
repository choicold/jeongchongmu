package com.jeongchongmu.domain.group.service;

import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.expense.Repository.TagRepository;
import com.jeongchongmu.domain.group.dto.GroupRequest;
import com.jeongchongmu.domain.group.dto.GroupDto;
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
import java.util.Random;
import java.util.stream.Collectors;

/*
 * GroupService가 제공하는 기능
 * 1. 그룹 CRUD
 * 2. 초대 코드 생성 및 재생성
 * 3. 그룹 목록 조회
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final TagRepository tagRepository;

    // 이거 링크 아직 안됩니다. 처리하는 컨트롤러는 따로 만들고 있어요.
    private static final String INVITE_BASE_URL = "https://jeongchongmu-production.up.railway.app/invite/";

    // 그룹 생성
    @Transactional
    public GroupDto createGroup(Long userId, GroupRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        String inviteCode = generateUniqueInviteCode();

        // 그룹 생성 요청을 바탕으로 기본 그룹 정보 추가
        Group group = Group.builder()
                .name(request.name())
                .description(request.description())
                .creator(creator)
                .inviteCode(inviteCode)
                .build();

        Group savedGroup = groupRepository.save(group);

        // 그룹 생성자를 OWNER로 자동 추가
        GroupMember ownerMember = GroupMember.builder()
                .user(creator)
                .group(savedGroup)
                .role(Role.OWNER)
                .build();

        groupMemberRepository.save(ownerMember);

        return toGroupDto(savedGroup);
    }

    // 그룹 Id를 통한 단일 그룹 조회
    public GroupDto getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));
        return toGroupDto(group);
    }

    // 유저 Id를 통한 그룹 조회(내가 속한 그룹 목록 조회)
    public List<GroupDto> getMyGroups(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        List<Group> groups = groupRepository.findAllGroupsByUser(user);

        return groups.stream()
                .map(this::toGroupDto)
                .toList();
    }

    // 그룹 수정(OWNER만 가능)
    @Transactional
    public GroupDto updateGroup(Long groupId, Long requesterId, GroupRequest request) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));
        validateOwnerPermission(group, requesterId);

        group.updateInfo(request.name(), request.description());

        return toGroupDto(group);
    }

    // 그룹 삭제(OWNER만 가능)
    @Transactional
    public void deleteGroup(Long groupId, Long requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));
        validateOwnerPermission(group, requesterId);

        expenseRepository.deleteByGroup(group);
        tagRepository.deleteByGroup(group);
        groupRepository.delete(group);
    }

    // 초대 코드 재생성(OWNER만 가능)
    @Transactional
    public GroupDto regenerateInviteCode(Long groupId, Long requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("그룹을 찾을 수 없습니다."));
        validateOwnerPermission(group, requesterId);

        String newInviteCode = generateUniqueInviteCode();
        group.regenerateInviteCode(newInviteCode);

        return toGroupDto(group);
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

    // 초대 코드 중복 조회
    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = generateRandomCode(8);
        } while(groupRepository.existsByInviteCode(inviteCode));
        return inviteCode;
    }

    // 랜덤 초대 코드 생성
    private String generateRandomCode(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        return random.ints(length, 0, chars.length())
                .mapToObj(chars::charAt)
                .map(Object::toString)
                .collect(Collectors.joining());
    }

    // Group Entity를 GroupDto로 변환
    private GroupDto toGroupDto(Group group) {
        int memberCount = groupMemberRepository.countByGroup(group);

        return new GroupDto(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getInviteCode(),
                INVITE_BASE_URL + group.getInviteCode(),
                new UserSummaryDto(group.getCreator().getId(), group.getCreator().getName()),
                memberCount,
                group.getCreatedAt()
        );
    }
}
