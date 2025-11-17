package com.jeongchongmu.domain.group.controller;

import com.jeongchongmu.domain.group.dto.GroupMemberDto;
import com.jeongchongmu.domain.group.dto.JoinGroupByCodeRequest;
import com.jeongchongmu.domain.group.service.GroupMemberService;
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
public class GroupMemberController {
    private final GroupMemberService groupMemberService;

    // 초대 코드로 그룹 참여
    @PostMapping("/join")
    public ResponseEntity<GroupMemberDto> joinGroup(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody JoinGroupByCodeRequest request
    ) {
        GroupMemberDto member = groupMemberService.joinGroupByInviteCode(
                userId,
                request.inviteCode()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    // 그룹 멤버 목록 조회
    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberDto>> getGroupMembers(
            @PathVariable Long groupId
    ) {
        List<GroupMemberDto> members = groupMemberService.getGroupMembers(groupId);
        return ResponseEntity.ok(members);
    }

    // 특정 멤버 조회
    @GetMapping("/{groupId}/memebers/{memberId}")
    public ResponseEntity<GroupMemberDto> getGroupMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId
    ) {
        GroupMemberDto member = groupMemberService.getGroupMember(groupId, memberId);
        return ResponseEntity.ok(member);
    }

    // 멤버 강제 퇴출(OWNER만 가능)
    @DeleteMapping("/{groupId}/members/{targetUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestAttribute("userId") Long requesterId
    ) {
        groupMemberService.removeMember(groupId, requesterId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    // 멤버 스스로 탈퇴
    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long groupId,
            @RequestAttribute("userId") Long userId
    ) {
        groupMemberService.leaveGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }
}
