package com.jeongchongmu.mcp.tools;

import com.jeongchongmu.domain.group.dto.GroupDto;
import com.jeongchongmu.domain.group.dto.GroupMemberDto;
import com.jeongchongmu.domain.group.dto.GroupRequest;
import com.jeongchongmu.domain.group.service.GroupMemberService;
import com.jeongchongmu.domain.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GroupAiTools {

    private final GroupService groupService;
    private final GroupMemberService groupMemberService;

    // =================================================================================
    // 1. 그룹 조회 및 생성 (기존 기능 + 상세 조회)
    // =================================================================================

    @Tool(description = "내가 속한 그룹의 목록(ID, 이름, 초대코드)을 조회합니다. 지출 기록 전 그룹 ID를 찾을 때 사용하세요.")
    public String getMyGroups(ToolContext context) {
        Long userId = getUserId(context);
        try {
            List<GroupDto> groups = groupService.getMyGroups(userId);
            if (groups.isEmpty()) return "가입된 그룹이 없습니다.";

            return groups.stream()
                    .map(g -> String.format("ID:%d | 이름:%s | 초대코드:%s", g.id(), g.name(), g.inviteCode()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "그룹 목록 조회 실패: " + e.getMessage();
        }
    }

    @Tool(description = "특정 그룹의 상세 정보를 조회합니다.")
    public String getGroupDetail(@ToolParam(description = "조회할 그룹 ID") Long groupId) {
        try {
            GroupDto g = groupService.getGroup(groupId);
            return String.format("📋 그룹 정보\n- 이름: %s\n- 설명: %s\n- 초대코드: %s\n- 멤버수: %d명",
                    g.name(), g.description(), g.inviteCode(), g.memberCount());
        } catch (Exception e) {
            return "그룹 상세 조회 실패: " + e.getMessage();
        }
    }

    @Tool(description = "새로운 그룹을 생성합니다. 생성 후 지출 기록 등의 후속 작업이 있다면 즉시 수행하세요.")
    public String createGroup(
            @ToolParam(description = "그룹 이름") String name,
            @ToolParam(description = "그룹 설명", required = false) String description,
            ToolContext context
    ) {
        Long userId = getUserId(context);
        try {
            String finalDesc = (description != null) ? description : "";
            GroupRequest request = new GroupRequest(name, finalDesc);
            GroupDto createdGroup = groupService.createGroup(userId, request);

            return String.format("✅ 그룹 생성 완료! (ID: %d, 이름: %s, 초대코드: %s)\n" +
                            "⚠️[시스템 알림] 영수증 처리 대기 중이라면 이 ID(%d)를 즉시 사용하세요.",
                    createdGroup.id(), createdGroup.name(), createdGroup.inviteCode(), createdGroup.id());
        } catch (Exception e) {
            return "❌ 그룹 생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 2. 그룹 관리 (수정, 삭제, 초대코드 재생성) - OWNER 전용
    // =================================================================================

    @Tool(description = "그룹의 이름이나 설명을 수정합니다. 사용자가 '이름을 바꿔줘'라고 명시하지 않았다면, 문맥에 따라 설명을 수정할 수도 있습니다.")
    public String updateGroup(
            @ToolParam(description = "수정할 그룹 ID") Long groupId,
            @ToolParam(description = "변경할 새로운 그룹 이름 (이름 변경 요청인 경우에만 입력)", required = false) String name,
            @ToolParam(description = "변경할 새로운 그룹 설명 (설명 변경 요청인 경우에만 입력)", required = false) String description,
            ToolContext context
    ) {
        Long userId = getUserId(context);
        try {
            // 기존 정보 조회
            GroupDto currentGroup = groupService.getGroup(groupId);

            // 변경할 값만 적용
            String finalName = (name != null) ? name : currentGroup.name();
            String finalDesc = (description != null) ? description : currentGroup.description();

            GroupRequest request = new GroupRequest(finalName, finalDesc);
            GroupDto updatedGroup = groupService.updateGroup(groupId, userId, request);

            return String.format("✅ 그룹 정보 수정 완료.\n- 이름: %s\n- 설명: %s",
                    updatedGroup.name(), updatedGroup.description());
        } catch (Exception e) {
            return "❌ 그룹 수정 실패: " + e.getMessage();
        }
    }

    @Tool(description = "그룹을 삭제합니다. (그룹장만 가능, 복구 불가)")
    public String deleteGroup(
            @ToolParam(description = "삭제할 그룹 ID") Long groupId,
            ToolContext context
    ) {
        Long userId = getUserId(context);
        try {
            groupService.deleteGroup(groupId, userId);
            return "🗑️ 그룹(ID:" + groupId + ")과 관련된 모든 지출 내역이 삭제되었습니다.";
        } catch (Exception e) {
            return "❌ 그룹 삭제 실패: " + e.getMessage();
        }
    }

    @Tool(description = "그룹 초대 코드를 새로 발급합니다. 이전 코드는 사용할 수 없게 됩니다. (그룹장만 가능)")
    public String regenerateInviteCode(
            @ToolParam(description = "그룹 ID") Long groupId,
            ToolContext context
    ) {
        Long userId = getUserId(context);
        try {
            GroupDto group = groupService.regenerateInviteCode(groupId, userId);
            return String.format("🔄 초대 코드가 변경되었습니다: %s", group.inviteCode());
        } catch (Exception e) {
            return "❌ 코드 재생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 3. 멤버 관리 (가입, 조회, 추방, 탈퇴)
    // =================================================================================

    @Tool(description = "초대 코드를 입력하여 그룹에 가입합니다.")
    public String joinGroupByCode(
            @ToolParam(description = "초대 코드 (8자리)") String inviteCode,
            ToolContext context
    ) {
        Long userId = getUserId(context);
        try {
            GroupMemberDto member = groupMemberService.joinGroupByInviteCode(userId, inviteCode);
            return "✅ 그룹 가입 성공! (역할: " + member.role() + ")";
        } catch (Exception e) {
            return "❌ 가입 실패: " + e.getMessage();
        }
    }

    @Tool(description = "특정 그룹의 멤버 목록을 조회합니다.")
    public String getGroupMembers(
            @ToolParam(description = "그룹 ID") Long groupId
    ) {
        try {
            List<GroupMemberDto> members = groupMemberService.getGroupMembers(groupId);
            if (members.isEmpty()) return "멤버가 없습니다.";

            return members.stream()
                    .map(m -> String.format("- %s (ID:%d, %s)", m.user().name(), m.user().id(), m.role()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "멤버 조회 실패: " + e.getMessage();
        }
    }

    @Tool(description = "그룹에서 특정 멤버를 내보냅니다(강제 퇴출). (그룹장만 가능)")
    public String kickMember(
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "내보낼 사용자의 ID (멤버 목록 조회를 통해 확인)") Long targetUserId,
            ToolContext context
    ) {
        Long requesterId = getUserId(context);
        try {
            groupMemberService.removeMember(groupId, requesterId, targetUserId);
            return "👢 해당 멤버를 그룹에서 내보냈습니다.";
        } catch (Exception e) {
            return "❌ 퇴출 실패: " + e.getMessage();
        }
    }

    @Tool(description = "그룹에서 스스로 탈퇴합니다.")
    public String leaveGroup(
            @ToolParam(description = "탈퇴할 그룹 ID") Long groupId,
            ToolContext context
    ) {
        Long userId = getUserId(context);
        try {
            groupMemberService.leaveGroup(groupId, userId);
            return "👋 그룹에서 탈퇴했습니다.";
        } catch (Exception e) {
            return "❌ 탈퇴 실패: " + e.getMessage();
        }
    }

    // --- Helper ---
    private Long getUserId(ToolContext context) {
        return (Long) context.getContext().get("currentUserId");
    }
}