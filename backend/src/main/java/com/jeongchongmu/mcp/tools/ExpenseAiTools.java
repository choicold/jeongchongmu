package com.jeongchongmu.mcp.tools;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.domain.expense.dto.*;
import com.jeongchongmu.domain.expense.ExpenseService;
import com.jeongchongmu.user.User;
import com.jeongchongmu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExpenseAiTools {

    private final ExpenseService expenseService;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final ObjectMapper objectMapper;

    // =================================================================================
    // 1. [저장] createExpense (OCR 지원)
    // =================================================================================
    @Tool(description = "새로운 지출 내역을 기록합니다. OCR 분석 결과가 있다면 itemsJson과 receiptUrl을 반드시 포함하세요.")
    public String createExpense(
            @ToolParam(description = "지출 제목") String title,
            @ToolParam(description = "지출 총 금액") int amount,
            @ToolParam(description = "그룹 ID") Long groupId,
            @ToolParam(description = "설명", required = false) String description,
            @ToolParam(description = "영수증 이미지 URL (OCR 결과에 있다면 필수)", required = false) String receiptUrl,
            @ToolParam(description = "세부 품목 리스트 JSON (예: [{\"name\":\"커피\",\"price\":4500,\"quantity\":1}])", required = false) String itemsJson,
            @ToolParam(description = "태그 목록 (콤마로 구분, 예: 식비,회식)", required = false) String tags,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        if (receiptUrl != null && expenseRepository.existsByReceiptUrl(receiptUrl)) {
            return "⚠️ 이미 등록된 영수증입니다.";
        }

        try {
            List<ExpenseItemDTO> items = parseItemsJson(itemsJson, title, amount);
            List<String> tagList = parseTags(tags);

            long itemsSum = items.stream().mapToLong(ExpenseItemDTO::price).sum();
            long finalAmount = (itemsSum > 0) ? itemsSum : amount;

            ExpenseCreateDTO dto = new ExpenseCreateDTO(
                    title,
                    finalAmount,
                    LocalDateTime.now(),
                    groupId,
                    Collections.emptyList(),
                    items,
                    tagList,
                    receiptUrl
            );

            expenseService.createExpense(dto, userId);

            return String.format("✅ 지출 기록 성공! (제목: %s, 금액: %d원)", title, finalAmount);

        } catch (Exception e) {
            log.error("Create Expense Error", e);
            return "❌ 지출 기록 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 2. [수정] updateExpense
    // =================================================================================
    @Tool(description = "기존 지출 내역을 수정합니다. 변경하고 싶은 항목만 입력하세요.")
    public String updateExpense(
            @ToolParam(description = "수정할 지출 ID") Long expenseId,
            @ToolParam(description = "새로운 제목", required = false) String title,
            @ToolParam(description = "새로운 총 금액", required = false) Integer amount,
            @ToolParam(description = "새로운 아이템 리스트 JSON", required = false) String itemsJson,
            @ToolParam(description = "새로운 태그 목록 (콤마로 구분)", required = false) String tags,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);

        try {
            List<ExpenseItemDTO> items = null;
            if (itemsJson != null) {
                items = parseItemsJson(itemsJson, (title != null ? title : "수정항목"), (amount != null ? amount : 0));
            } else if (amount != null) {
                items = List.of(new ExpenseItemDTO(title != null ? title : "수정된 금액", amount.longValue(), 1));
            }

            ExpenseUpdateDTO dto = new ExpenseUpdateDTO(
                    title,
                    (amount != null) ? amount.longValue() : null,
                    null,
                    null,
                    items,
                    parseTags(tags)
            );

            expenseService.updateExpense(dto, expenseId, userId);
            return "✅ 지출 내역(ID:" + expenseId + ")이 수정되었습니다.";

        } catch (Exception e) {
            return "❌ 수정 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 3. [삭제] deleteExpense
    // =================================================================================
    @Tool(description = "지출 내역을 삭제합니다.")
    public String deleteExpense(
            @ToolParam(description = "삭제할 지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);
        try {
            expenseService.deleteExpense(expenseId, userId);
            return "🗑️ 지출 내역(ID:" + expenseId + ")이 삭제되었습니다.";
        } catch (Exception e) {
            return "❌ 삭제 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 4. [조회-목록] getExpensesByGroup
    // =================================================================================
    @Tool(description = "특정 그룹의 지출 내역을 조회합니다. 연도나 기간을 지정할 수 있습니다.")
    public String getExpensesByGroup(
            @ToolParam(description = "조회할 그룹 ID") Long groupId,
            @ToolParam(description = "조회할 연도 (예: 2025). null이면 전체 조회", required = false) Integer year,
            @ToolParam(description = "시작 날짜 (YYYY-MM-DD)", required = false) String startDate,
            @ToolParam(description = "종료 날짜 (YYYY-MM-DD)", required = false) String endDate,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);
        try {
            User user = getUser(userId);
            List<ExpenseSimpleDTO> list = expenseService.getExpensesByGroup(groupId, user);

            // 연도 필터링
            if (year != null) {
                list = list.stream()
                        .filter(e -> e.expenseData().getYear() == year)
                        .collect(Collectors.toList());
            }

            // 기간 필터링
            if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
                LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
                list = list.stream()
                        .filter(e -> !e.expenseData().isBefore(start) && !e.expenseData().isAfter(end))
                        .collect(Collectors.toList());
            }

            if (list.isEmpty()) return "해당 기간에 기록된 지출이 없습니다.";

            String summary = list.stream().limit(10)
                    .map(e -> String.format("ID:%d | %s (%,d원) - %s [%s]",
                            e.id(), e.title(), e.amount(), e.payerName(),
                            e.expenseData().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))))
                    .collect(Collectors.joining("\n"));

            return String.format("총 %d건 중 최근 10건:\n%s\n\n💡 상세 조회 시 'ID:' 뒤의 숫자를 사용하세요.",
                    list.size(), summary);
        } catch (Exception e) {
            return "❌ 조회 실패: " + e.getMessage();
        }
    }

    // =================================================================================
    // 5. [조회-상세] getExpenseDetail (참여자 목록 추가됨!)
    // =================================================================================
    @Tool(description = "특정 지출 내역의 상세 정보(품목, 태그, 영수증, 참여자 포함)를 조회합니다.")
    public String getExpenseDetail(
            @ToolParam(description = "지출 ID") Long expenseId,
            ToolContext context
    ) {
        Long userId = getUserIdFromContext(context);
        try {
            User user = getUser(userId);
            ExpenseDetailDTO detail = expenseService.getExpenseDetail(expenseId, user);

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📄 상세 내역 (ID:%d)\n", detail.id()));
            sb.append(String.format("- 제목: %s\n- 금액: %d원\n- 결제자: %s\n", detail.title(), detail.amount(), detail.payerName()));
            sb.append(String.format("- 날짜: %s\n", detail.expenseData()));
            sb.append("- 태그: ").append(String.join(", ", detail.tagNames())).append("\n");

            // ✨ [추가된 부분] 참여자 목록 출력
            if (detail.participants() != null && !detail.participants().isEmpty()) {
                sb.append("- 참여자: ").append(String.join(", ", detail.participants())).append("\n");
            }

            if (detail.items() != null && !detail.items().isEmpty()) {
                sb.append("- 품목:\n");
                detail.items().forEach(i -> sb.append(String.format("  * %s: %d원 (%d개)\n", i.name(), i.price(), i.quantity())));
            }
            if (detail.receiptUrl() != null) {
                sb.append("- 영수증: ").append(detail.receiptUrl()).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "❌ 상세 조회 실패: " + e.getMessage();
        }
    }

    // --- Helper Methods ---

    private Long getUserIdFromContext(ToolContext context) {
        Long userId = (Long) context.getContext().get("currentUserId");
        if (userId == null) throw new IllegalStateException("로그인 정보 없음");
        return userId;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private List<ExpenseItemDTO> parseItemsJson(String json, String defaultTitle, long defaultPrice) {
        if (json != null && !json.isBlank() && !json.equals("null")) {
            try {
                return objectMapper.readValue(json, new TypeReference<List<ExpenseItemDTO>>() {});
            } catch (Exception e) {
                log.warn("JSON Parse Error: {}", e.getMessage());
            }
        }
        return List.of(new ExpenseItemDTO(defaultTitle, defaultPrice, 1));
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return Collections.emptyList();
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .collect(Collectors.toList());
    }
}