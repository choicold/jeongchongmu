package com.jeongchongmu.mcp.tools;

import com.jeongchongmu.settlement.service.SettlementService;
import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.vote.service.VoteService;
import com.jeongchongmu.domain.notification.service.NotificationService;
import com.jeongchongmu.domain.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FeatureAiTools {

    private final SettlementService settlementService;
    private final VoteService voteService;
    private final NotificationService notificationService;

    // --- 정산 기능 ---
    @Tool(description = "특정 그룹에 대해 정산을 시작(생성)합니다.")
    public String createSettlement(
            @ToolParam(description = "정산할 그룹 ID") Long groupId,
            ToolContext context
    ) {
        try {
            // 정산 생성 로직 (Service 호출)
            // settlementService.createSettlement(new SettlementCreateRequest(groupId));
            return groupId + "번 그룹의 정산이 생성되었습니다.";
        } catch (Exception e) {
            return "정산 생성 실패: " + e.getMessage();
        }
    }

    // --- 투표 기능 ---
    @Tool(description = "특정 지출 내역에 대해 투표를 생성합니다.")
    public String createVote(
            @ToolParam(description = "투표를 생성할 지출 ID") Long expenseId
    ) {
        try {
            Long voteId = voteService.createVote(expenseId);
            return "투표가 생성되었습니다. ID: " + voteId;
        } catch (Exception e) {
            return "투표 생성 실패: " + e.getMessage();
        }
    }

    // --- 알림 기능 ---
    @Tool(description = "나에게 온 읽지 않은 알림 목록을 확인합니다.")
    public String getMyNotifications(ToolContext context) {
        Long userId = (Long) context.getContext().get("currentUserId");
        try {
            List<NotificationDto> notis = notificationService.getMyNotifications(userId);
            if (notis.isEmpty()) return "새로운 알림이 없습니다.";

            return notis.stream()
                    .map(n -> String.format("[%s] %s", n.type(), n.content()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "알림 조회 실패";
        }
    }
}