package com.jeongchongmu.domain.group.controller;

import com.jeongchongmu.domain.group.dto.GroupDto;
import com.jeongchongmu.domain.group.dto.GroupRequest;
import com.jeongchongmu.domain.group.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * 기능은 SwaggerAPI 참조하세요.
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;

    // 그룹 생성
    @PostMapping
    public ResponseEntity<GroupDto> createGroup(
            @RequestAttribute("userId") Long userId, // 인증된 사용자의 Id
            @Valid @RequestBody GroupRequest request
    ) {
        GroupDto createdGroup = groupService.createGroup(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGroup);
    }

    // 그룹 Id를 통한 단일 그룹 조회
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDto> getGroup(@PathVariable Long groupId) {
        GroupDto group = groupService.getGroup(groupId);
        return ResponseEntity.ok(group);
    }

    // 유저 Id를 통한 그룹 조회(내가 속한 그룹 목록 조회)
    @GetMapping
    public ResponseEntity<List<GroupDto>> getMyGroups(
            @RequestAttribute("userId") Long userId
    ) {
        List<GroupDto> groups = groupService.getMyGroups(userId);
        return ResponseEntity.ok(groups);
    }

    // 그룹 수정(OWNER만 가능)
    @PutMapping("/{groupId}")
    public ResponseEntity<GroupDto> updateGroup(
            @PathVariable Long groupId, // {groupId}에 groupId가 매핑됨
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody GroupRequest request
    ) {
        GroupDto updatedGroup = groupService.updateGroup(groupId, userId, request);
        return ResponseEntity.ok(updatedGroup);
    }

    // 그룹 삭제(OWNER만 가능)
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            @RequestAttribute("userId") Long userId
    ) {
        groupService.deleteGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }

    // 초대 코드 재생성(OWNER만 가능)
    @PostMapping("/{groupId}/invite-code")
    public ResponseEntity<GroupDto> regenerateInviteCode(
            @PathVariable Long groupId,
            @RequestAttribute("userId") Long userId
    ) {
        GroupDto group = groupService.regenerateInviteCode(groupId, userId);
        return ResponseEntity.ok(group);
    }
}
