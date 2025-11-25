package com.jeongchongmu.domain.expense;

import com.jeongchongmu.domain.expense.dto.ExpenseCreateDTO;
import com.jeongchongmu.domain.expense.dto.ExpenseDetailDTO;
import com.jeongchongmu.domain.expense.dto.ExpenseSimpleDTO;
import com.jeongchongmu.domain.expense.dto.ExpenseUpdateDTO;
import com.jeongchongmu.user.User;
import jakarta.validation.Valid; // 👈 1. @Valid (DTO 검증용)
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus; // 👈 2. HttpStatus (201 CREATED)
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal; // 👈 3. 유저 정보
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses") // 👈 이 컨트롤러의 기본 API 경로
@RequiredArgsConstructor
public class expenseController {

    private final expenseService expenseService;

    /**
     * [저장] (1. createExpense)
     * POST /api/expenses
     */
    @PostMapping
    public ResponseEntity<ExpenseDetailDTO> createExpense(
            @Valid @RequestBody ExpenseCreateDTO dto,
            @AuthenticationPrincipal User user // 👈 Spring Security가 현재 유저를 주입
    ) {
        // Service에 DTO와 "지출자(Payer) ID"를 넘김
        ExpenseDetailDTO createdExpense = expenseService.createExpense(dto, user.getId());

        // 생성 성공 시, HTTP 201 Created 상태와 생성된 DTO를 반환
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
    }

    /**
     * [수정] (3. updateExpense)
     * PATCH /api/expenses/{id}
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ExpenseDetailDTO> updateExpense(
            @PathVariable("id") Long expenseId,
            @Valid @RequestBody ExpenseUpdateDTO dto,
            @AuthenticationPrincipal User user
    ) {
        // Service에 DTO, "지출 ID", "현재 유저 ID" (권한 검증용)를 넘김
        boolean res = expenseService.updateExpense(dto, expenseId, user.getId());

        // 수정 성공 시, HTTP 200 OK와 수정된 DTO를 반환
        return ResponseEntity.ok().build();
    }

    /**
     * [삭제] (2. deleteExpense)
     * DELETE /api/expenses/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable("id") Long expenseId,
            @AuthenticationPrincipal User user
    ) {
        // Service에 "지출 ID", "현재 유저 ID" (권한 검증용)를 넘김
        expenseService.deleteExpense(expenseId, user.getId());

        // 삭제 성공 시, HTTP 204 No Content (본문 없음) 반환
        return ResponseEntity.noContent().build();
    }

    /**
     * [조회 - 상세] (5. getExpenseDetail)
     * GET /api/expenses/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDetailDTO> getExpenseDetail(
            @PathVariable("id") Long expenseId,
            @AuthenticationPrincipal User user
    ) {
        ExpenseDetailDTO expense = expenseService.getExpenseDetail(expenseId, user);

        return ResponseEntity.ok(expense);
    }

    /**
     * [조회 - 목록] (4. getExpensesByGroup)
     * GET /api/expenses?groupId={id}
     */
    @GetMapping
    public ResponseEntity<List<ExpenseSimpleDTO>> getExpensesByGroup(
            @RequestParam Long groupId,
            @AuthenticationPrincipal User user
    ) {
        List<ExpenseSimpleDTO> expenses = expenseService.getExpensesByGroup(groupId, user);

        return ResponseEntity.ok(expenses);
    }
}