package com.jeongchongmu.settlement.controller;

import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
import com.jeongchongmu.settlement.dto.SettlementSummaryResponse;
import com.jeongchongmu.settlement.dto.TransferConfirmRequest;
import com.jeongchongmu.settlement.service.SettlementService;
import com.jeongchongmu.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settlements") // "/api/settlements"로 오는 요청을 이 컨트롤러가 처리
public class SettlementController {

    private final SettlementService settlementService;

    /**
     * 정산 생성 API
     * [POST] /api/settlements
     */
    @PostMapping
    public ResponseEntity<SettlementResponse> createSettlement(
            @RequestBody SettlementCreateRequest request
    ) {
        // Service의 createSettlement 메서드 호출
        SettlementResponse response = settlementService.createSettlement(request);

        // 생성 성공 시, 201 Created 상태와 함께 정산 결과 반환
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // [R] 정산 단건 조회
    @GetMapping("/{settlementId}")
    public ResponseEntity<SettlementResponse> getSettlement(@PathVariable Long settlementId) {
        SettlementResponse response = settlementService.getSettlement(settlementId);
        return ResponseEntity.ok(response);
    }

    // [R] 지출 ID로 정산 조회
    @GetMapping("/by-expense/{expenseId}")
    public ResponseEntity<SettlementResponse> getSettlementByExpenseId(@PathVariable Long expenseId) {
        SettlementResponse response = settlementService.getSettlementByExpenseId(expenseId);
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자의 정산 현황 요약 조회 API
     * [GET] /api/settlements/my-summary
     *
     * 현재 로그인한 사용자가 받아야 할 돈과 보내야 할 돈의 총계를 반환합니다.
     */
    @GetMapping("/my-summary")
    public ResponseEntity<SettlementSummaryResponse> getMySettlementSummary(
            @AuthenticationPrincipal User user
    ) {
        SettlementSummaryResponse response = settlementService.getMySettlementSummary(user.getId());
        return ResponseEntity.ok(response);
    }

    // [U] 정산 수정 (재정산)
    @PutMapping("/{settlementId}")
    public ResponseEntity<SettlementResponse> updateSettlement(
            @PathVariable Long settlementId,
            @RequestBody SettlementCreateRequest request // 생성과 동일한 정보로 수정한다고 가정
    ) {
        SettlementResponse response = settlementService.updateSettlement(settlementId, request);
        return ResponseEntity.ok(response);
    }

    // [D] 정산 삭제
    @DeleteMapping("/{settlementId}")
    public ResponseEntity<Void> deleteSettlement(@PathVariable Long settlementId) {
        settlementService.deleteSettlement(settlementId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 송금 확인 API
     * [POST] /api/settlements/{settlementId}/confirm-transfer
     *
     * 사용자가 송금 버튼을 누르면 호출되며,
     * 모든 멤버가 송금 완료 시 정산 상태를 COMPLETED로 변경합니다.
     */
    @PostMapping("/{settlementId}/confirm-transfer")
    public ResponseEntity<SettlementResponse> confirmTransfer(
            @PathVariable Long settlementId,
            @RequestBody TransferConfirmRequest request
    ) {
        SettlementResponse response = settlementService.confirmTransfer(
                settlementId,
                request.getDebtorId(),
                request.getCreditorId()
        );
        return ResponseEntity.ok(response);
    }

}