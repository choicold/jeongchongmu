package com.jeongchongmu.mcp.tools;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.expense.dto.ExpenseSimpleDTO;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.settlement.dto.*;
import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.entity.SettlementDetail;
import com.jeongchongmu.settlement.enums.SettlementMethod;
import com.jeongchongmu.settlement.repository.SettlementDetailRepository;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.settlement.service.SettlementService;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementAiTools {

    private final SettlementService settlementService;
    private final SettlementRepository settlementRepository;
    private final SettlementDetailRepository settlementDetailRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ObjectMapper objectMapper;

    // =================================================================================
    // 1. N빵 정산 생성
    // =================================================================================
    @Tool(description = "N빵(균등 분배) 정산을 생성합니다. 참여자들이 금액을 동일하게 나눠 부담합니다.")
    @Transactional
    public String createNBunSettlement(
            @ToolParam(description = "정산할 지출 ID") Long expenseId,
            @ToolParam(description = "참여자 ID 목록 (콤마로 구분, 예: 1,2,3,4)") String participantIds,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, expense.getGroup())) {
                return "❌ 해당 그룹의 멤버만 정산을 생성할 수 있습니다.";
            }

            // 이미 정산이 있는지 확인
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "⚠️ 이미 해당 지출에 대한 정산이 존재합니다.";
            }

            // 참여자 ID 파싱
            List<Long> participantIdList = parseParticipantIds(participantIds);
            if (participantIdList.isEmpty()) {
                return "❌ 참여자 ID를 입력해주세요.";
            }

            // 정산 요청 생성
            SettlementCreateRequest request = new SettlementCreateRequest();
            setField(request, "expenseId", expenseId);
            setField(request, "method", SettlementMethod.N_BUN_1);
            setField(request, "participantUserIds", participantIdList);

            SettlementResponse response = settlementService.createSettlement(request);

            return formatSettlementResponse(response, expense, "N빵");

        } catch (Exception e) {
            log.error("N빵 정산 생성 실패", e);
            return "❌ 정산 생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 2. 직접 정산 생성
    // =================================================================================
    @Tool(description = "직접 정산을 생성합니다. 각 참여자가 부담할 금액을 직접 지정합니다.")
    @Transactional
    public String createDirectSettlement(
            @ToolParam(description = "정산할 지출 ID") Long expenseId,
            @ToolParam(description = "정산 내역 JSON (예: [{\"userId\":1,\"amount\":15000},{\"userId\":2,\"amount\":25000}])") String entriesJson,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, expense.getGroup())) {
                return "❌ 해당 그룹의 멤버만 정산을 생성할 수 있습니다.";
            }

            // 이미 정산이 있는지 확인
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "⚠️ 이미 해당 지출에 대한 정산이 존재합니다.";
            }

            // JSON 파싱
            List<DirectSettlementEntry> entries;
            try {
                entries = objectMapper.readValue(entriesJson, new TypeReference<List<DirectSettlementEntry>>() {});
            } catch (Exception e) {
                return "❌ JSON 형식이 올바르지 않습니다. 예: [{\"userId\":1,\"amount\":15000}]";
            }

            // 금액 합계 검증
            long sum = entries.stream().mapToLong(DirectSettlementEntry::getAmount).sum();
            if (sum != expense.getAmount()) {
                return String.format("❌ 입력한 금액 합계(%,d원)가 지출 총액(%,d원)과 일치하지 않습니다.", sum, expense.getAmount());
            }

            // 정산 요청 생성
            SettlementCreateRequest request = new SettlementCreateRequest();
            setField(request, "expenseId", expenseId);
            setField(request, "method", SettlementMethod.DIRECT);
            setField(request, "directEntries", entries);

            SettlementResponse response = settlementService.createSettlement(request);

            return formatSettlementResponse(response, expense, "직접 정산");

        } catch (Exception e) {
            log.error("직접 정산 생성 실패", e);
            return "❌ 정산 생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 3. 비율 정산 생성
    // =================================================================================
    @Tool(description = "비율(퍼센트) 정산을 생성합니다. 각 참여자가 부담할 비율을 지정합니다. 비율 합계는 100%여야 합니다.")
    @Transactional
    public String createPercentSettlement(
            @ToolParam(description = "정산할 지출 ID") Long expenseId,
            @ToolParam(description = "정산 내역 JSON (예: [{\"userId\":1,\"ratio\":60},{\"userId\":2,\"ratio\":40}])") String entriesJson,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, expense.getGroup())) {
                return "❌ 해당 그룹의 멤버만 정산을 생성할 수 있습니다.";
            }

            // 이미 정산이 있는지 확인
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "⚠️ 이미 해당 지출에 대한 정산이 존재합니다.";
            }

            // JSON 파싱
            List<PercentSettlementEntry> entries;
            try {
                entries = objectMapper.readValue(entriesJson, new TypeReference<List<PercentSettlementEntry>>() {});
            } catch (Exception e) {
                return "❌ JSON 형식이 올바르지 않습니다. 예: [{\"userId\":1,\"ratio\":60}]";
            }

            // 비율 합계 검증
            double ratioSum = entries.stream().mapToDouble(PercentSettlementEntry::getRatio).sum();
            if (Math.abs(ratioSum - 100.0) > 0.01) {
                return String.format("❌ 비율 합계(%.1f%%)가 100%%가 아닙니다.", ratioSum);
            }

            // 정산 요청 생성
            SettlementCreateRequest request = new SettlementCreateRequest();
            setField(request, "expenseId", expenseId);
            setField(request, "method", SettlementMethod.PERCENT);
            setField(request, "percentEntries", entries);

            SettlementResponse response = settlementService.createSettlement(request);

            return formatSettlementResponse(response, expense, "비율 정산");

        } catch (Exception e) {
            log.error("비율 정산 생성 실패", e);
            return "❌ 정산 생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 4. 항목별 정산 생성 (투표 기반)
    // =================================================================================
    @Tool(description = "항목별(투표 기반) 정산을 생성합니다. 투표 결과를 기반으로 각자 선택한 항목 금액만 부담합니다.")
    @Transactional
    public String createItemSettlement(
            @ToolParam(description = "정산할 지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, expense.getGroup())) {
                return "❌ 해당 그룹의 멤버만 정산을 생성할 수 있습니다.";
            }

            // 이미 정산이 있는지 확인
            if (settlementRepository.findByExpenseId(expenseId).isPresent()) {
                return "⚠️ 이미 해당 지출에 대한 정산이 존재합니다.";
            }

            // 정산 요청 생성
            SettlementCreateRequest request = new SettlementCreateRequest();
            setField(request, "expenseId", expenseId);
            setField(request, "method", SettlementMethod.ITEM);

            SettlementResponse response = settlementService.createSettlement(request);

            return formatSettlementResponse(response, expense, "항목별 정산");

        } catch (Exception e) {
            log.error("항목별 정산 생성 실패", e);
            // 투표가 없는 경우 친절한 메시지
            if (e.getMessage() != null && e.getMessage().contains("투표")) {
                return "❌ " + e.getMessage() + "\n\n💡 항목별 정산을 하려면 먼저 투표를 생성하고 참여자들이 투표를 완료해야 합니다.";
            }
            return "❌ 정산 생성 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 5. 정산 현황 조회
    // =================================================================================
    @Tool(description = "지출의 정산 현황을 조회합니다. 누가 누구에게 얼마를 보내야 하는지 확인할 수 있습니다.")
    @Transactional(readOnly = true)
    public String getSettlementStatus(
            @ToolParam(description = "조회할 지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);
            Expense expense = getExpense(expenseId);

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, expense.getGroup())) {
                return "❌ 해당 그룹의 멤버만 조회할 수 있습니다.";
            }

            // 정산 조회
            Settlement settlement = settlementRepository.findByExpenseId(expenseId)
                    .orElse(null);

            if (settlement == null) {
                return "⚠️ 아직 정산이 생성되지 않았습니다.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("💰 정산 현황: %s\n", expense.getTitle()));
            sb.append(String.format("- 정산 ID: %d\n", settlement.getId()));
            sb.append(String.format("- 총액: %,d원\n", expense.getAmount()));
            sb.append(String.format("- 방식: %s\n", getMethodName(settlement.getMethod())));
            sb.append(String.format("- 상태: %s\n\n", settlement.getStatus().name().equals("COMPLETED") ? "완료 ✅" : "진행중 ⏳"));

            sb.append("📋 송금 내역:\n");

            for (SettlementDetail detail : settlement.getDetails()) {
                String status = detail.isSent() ? "✅ 완료" : "⏳ 대기";
                sb.append(String.format("  [상세 ID:%d] %s → %s: %,d원 %s\n",
                        detail.getId(),
                        detail.getDebtor().getName(),
                        detail.getCreditor().getName(),
                        detail.getAmount(),
                        status));

                // 송금 정보 (미완료인 경우만)
                if (!detail.isSent() && detail.getCreditor().getBankName() != null) {
                    sb.append(String.format("    💳 %s %s\n",
                            detail.getCreditor().getBankName(),
                            detail.getCreditor().getAccountNumber()));
                }
            }

            // 완료 여부 요약
            long completedCount = settlement.getDetails().stream().filter(SettlementDetail::isSent).count();
            long totalCount = settlement.getDetails().size();
            sb.append(String.format("\n📊 진행률: %d/%d 완료", completedCount, totalCount));

            return sb.toString();

        } catch (Exception e) {
            log.error("정산 현황 조회 실패", e);
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 6. 송금 확인 (완료 표시)
    // =================================================================================
    @Tool(description = "송금 완료를 확인합니다. 본인의 송금 건만 완료 처리할 수 있습니다.")
    @Transactional
    public String confirmTransfer(
            @ToolParam(description = "정산 ID") Long settlementId,
            @ToolParam(description = "채권자(돈 받는 사람) ID") Long creditorId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);

            Settlement settlement = settlementRepository.findById(settlementId)
                    .orElseThrow(() -> new IllegalArgumentException("정산을 찾을 수 없습니다."));

            // 해당 상세 내역 찾기
            SettlementDetail targetDetail = settlement.getDetails().stream()
                    .filter(detail -> detail.getDebtor().getId().equals(userId)
                            && detail.getCreditor().getId().equals(creditorId))
                    .findFirst()
                    .orElse(null);

            if (targetDetail == null) {
                return "❌ 해당하는 송금 내역을 찾을 수 없습니다. 본인의 송금 건인지 확인해주세요.";
            }

            if (targetDetail.isSent()) {
                return "⚠️ 이미 송금 완료 처리된 건입니다.";
            }

            // 서비스 호출하여 송금 확인 처리
            SettlementResponse response = settlementService.confirmTransfer(settlementId, userId, creditorId);

            // 전체 정산 완료 여부 확인
            boolean allCompleted = response.getStatus().name().equals("COMPLETED");

            if (allCompleted) {
                return String.format("✅ 송금 완료! (%s → %s: %,d원)\n\n🎉 모든 정산이 완료되었습니다!",
                        user.getName(),
                        targetDetail.getCreditor().getName(),
                        targetDetail.getAmount());
            }

            return String.format("✅ 송금 완료 처리되었습니다.\n- %s → %s: %,d원",
                    user.getName(),
                    targetDetail.getCreditor().getName(),
                    targetDetail.getAmount());

        } catch (Exception e) {
            log.error("송금 확인 처리 실패", e);
            return "❌ 처리 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 7. 내 정산 요약 조회
    // =================================================================================
    @Tool(description = "내가 받아야 할 돈과 보내야 할 돈의 총계를 조회합니다.")
    @Transactional(readOnly = true)
    public String getMySettlementSummary(ToolContext context) {
        Long userId = getUserIdFromContext(context);

        try {
            SettlementSummaryResponse summary = settlementService.getMySettlementSummary(userId);

            StringBuilder sb = new StringBuilder();
            sb.append("💰 내 정산 현황 요약\n\n");
            sb.append(String.format("📥 받아야 할 돈: %,d원\n", summary.getToReceive()));
            sb.append(String.format("📤 보내야 할 돈: %,d원\n", summary.getToSend()));

            long balance = summary.getToReceive() - summary.getToSend();
            if (balance > 0) {
                sb.append(String.format("\n📊 순수익: +%,d원 💚", balance));
            } else if (balance < 0) {
                sb.append(String.format("\n📊 순지출: %,d원 💔", balance));
            } else {
                sb.append("\n📊 균형 상태입니다! ⚖️");
            }

            return sb.toString();

        } catch (Exception e) {
            log.error("정산 요약 조회 실패", e);
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 8. 내가 보내야 할 정산 조회
    // =================================================================================
    @Tool(description = "내가 보내야 할 미완료 정산 내역을 조회합니다.")
    @Transactional(readOnly = true)
    public String getMyPendingSettlements(
            @ToolParam(description = "그룹 ID (선택사항, 미입력시 전체 조회)", required = false) Long groupId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            // 모든 정산 상세 내역 조회 후 필터링
            List<SettlementDetail> allDetails = settlementDetailRepository.findAll();

            // 내가 채무자이고 미송금인 건만 필터링
            List<SettlementDetail> myDebts = allDetails.stream()
                    .filter(d -> d.getDebtor().getId().equals(userId) && !d.isSent())
                    .collect(Collectors.toList());

            if (myDebts.isEmpty()) {
                return "✅ 보내야 할 정산이 없습니다!";
            }

            // 그룹 필터링
            if (groupId != null) {
                myDebts = myDebts.stream()
                        .filter(d -> d.getSettlement().getExpense().getGroup().getId().equals(groupId))
                        .collect(Collectors.toList());
            }

            if (myDebts.isEmpty()) {
                return "✅ 해당 그룹에서 보내야 할 정산이 없습니다!";
            }

            StringBuilder sb = new StringBuilder();
            sb.append("💸 내가 보내야 할 정산:\n\n");

            long totalAmount = 0;
            for (SettlementDetail detail : myDebts) {
                Expense expense = detail.getSettlement().getExpense();
                sb.append(String.format("[정산 ID:%d / 상세 ID:%d] %s\n",
                        detail.getSettlement().getId(),
                        detail.getId(),
                        expense.getTitle()));
                sb.append(String.format("  → %s에게 %,d원\n",
                        detail.getCreditor().getName(),
                        detail.getAmount()));

                if (detail.getCreditor().getBankName() != null) {
                    sb.append(String.format("  💳 %s %s\n",
                            detail.getCreditor().getBankName(),
                            detail.getCreditor().getAccountNumber()));
                }
                sb.append("\n");
                totalAmount += detail.getAmount();
            }

            sb.append(String.format("📊 총 %d건, %,d원", myDebts.size(), totalAmount));

            return sb.toString();

        } catch (Exception e) {
            log.error("내 정산 조회 실패", e);
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 9. 정산 삭제
    // =================================================================================
    @Tool(description = "정산을 삭제합니다. 정산 생성자 또는 그룹 OWNER만 삭제할 수 있습니다.")
    @Transactional
    public String deleteSettlement(
            @ToolParam(description = "삭제할 정산 ID") Long settlementId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);

            Settlement settlement = settlementRepository.findById(settlementId)
                    .orElseThrow(() -> new IllegalArgumentException("정산을 찾을 수 없습니다."));

            Expense expense = settlement.getExpense();
            Group group = expense.getGroup();

            // 그룹 멤버 확인
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                return "❌ 해당 그룹의 멤버만 정산을 삭제할 수 있습니다.";
            }

            // 결제자(payer)인지 확인
            if (!expense.getPayer().getId().equals(userId)) {
                return "❌ 정산은 지출 등록자만 삭제할 수 있습니다.";
            }

            settlementService.deleteSettlement(settlementId);

            return String.format("✅ '%s' 지출의 정산이 삭제되었습니다.", expense.getTitle());

        } catch (Exception e) {
            log.error("정산 삭제 실패", e);
            return "❌ 삭제 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 10. 미정산 지출 조회 Tool
    // =================================================================================
    @Tool(description = "특정 그룹에서 아직 정산(청구서)이 생성되지 않은 지출 내역을 조회합니다. '정산 안 한 거 있어?', '빠뜨린 정산 찾아줘' 등의 질문에 사용합니다.")
    @Transactional(readOnly = true)
    public String getUnsettledExpensesInGroup(
            @ToolParam(description = "확인할 그룹 ID") Long groupId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            User user = getUser(userId);

            // 1. 본인이 속한 그룹인지 확인 (보안)
            if (!groupMemberRepository.existsByUserAndGroup(user,
                    com.jeongchongmu.domain.group.entity.Group.builder().id(groupId).build())) {
                return "❌ 해당 그룹의 멤버만 조회할 수 있습니다.";
            }

            // 2. 서비스 호출 (미정산 내역 조회)
            List<ExpenseSimpleDTO> unsettledExpenses = settlementService.getUnsettledExpenses(groupId);

            // 3. 결과 없음 처리
            if (unsettledExpenses.isEmpty()) {
                return "🎉 와우! 해당 그룹에는 정산되지 않은 지출이 없습니다. 모두 처리되었습니다.";
            }

            // 4. 결과 포맷팅
            StringBuilder sb = new StringBuilder();
            sb.append("🕵️ **정산이 필요한 지출 내역을 찾았습니다!**\n");
            sb.append(String.format("총 %d건의 미정산 내역이 있습니다.\n\n", unsettledExpenses.size()));

            for (ExpenseSimpleDTO ex : unsettledExpenses) {
                // 날짜 포맷팅 (YYYY-MM-DD)
                String dateStr = ex.expenseData().format(DateTimeFormatter.ofPattern("MM/dd"));

                sb.append(String.format("📌 **ID: %d** | %s\n", ex.id(), ex.title()));
                sb.append(String.format("   - 금액: %,d원 (결제자: %s)\n", ex.amount(), ex.payerName()));
                sb.append(String.format("   - 날짜: %s\n\n", dateStr));
            }

            sb.append("💡 **'ID OOO번 N빵으로 정산해줘'** 또는 **'OOO번 투표 만들어줘'**라고 말씀하시면 바로 처리해드릴게요!");

            return sb.toString();

        } catch (Exception e) {
            log.error("미정산 내역 조회 실패", e);
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // Helper Methods
    // =================================================================================

    private Long getUserIdFromContext(ToolContext context) {
        Long userId = (Long) context.getContext().get("currentUserId");
        if (userId == null) {
            throw new IllegalStateException("로그인 정보 없음");
        }
        return userId;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Expense getExpense(Long expenseId) {
        return expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));
    }

    private List<Long> parseParticipantIds(String participantIds) {
        if (participantIds == null || participantIds.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return java.util.Arrays.stream(participantIds.split(","))
                    .map(String::trim)
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("참여자 ID 형식이 올바르지 않습니다.");
        }
    }

    private String getMethodName(SettlementMethod method) {
        return switch (method) {
            case N_BUN_1 -> "N빵 (균등분배)";
            case DIRECT -> "직접 정산";
            case PERCENT -> "비율 정산";
            case ITEM -> "항목별 정산 (투표 기반)";
        };
    }

    private String formatSettlementResponse(SettlementResponse response, Expense expense, String methodName) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("✅ %s 정산이 생성되었습니다!\n\n", methodName));
        sb.append(String.format("📋 %s (%,d원)\n", expense.getTitle(), expense.getAmount()));
        sb.append(String.format("- 정산 ID: %d\n\n", response.getSettlementId()));
        sb.append("💰 송금 내역:\n");

        for (SettlementDetailDto detail : response.getDetails()) {
            sb.append(String.format("  • %s → %s: %,d원\n",
                    detail.getDebtorName(),
                    detail.getCreditorName(),
                    detail.getAmount()));
        }

        sb.append("\n💡 송금 완료 후 '송금 확인' 처리를 해주세요.");

        return sb.toString();
    }

    // Reflection을 사용해 필드 설정 (SettlementCreateRequest에 setter가 없으므로)
    private void setField(Object obj, String fieldName, Object value) {
        try {
            var field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(obj, value);
        } catch (Exception e) {
            throw new RuntimeException("필드 설정 실패: " + fieldName, e);
        }
    }
}