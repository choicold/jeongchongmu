package com.jeongchongmu.settlement.controller;

import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
import com.jeongchongmu.settlement.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    /**
     * (추가) 정산 내역 단건 조회 API
     * [GET] /api/settlements/{settlementId}
     */
    // @GetMapping("/{settlementId}")
    // public ResponseEntity<SettlementResponse> getSettlement(
    //         @PathVariable Long settlementId
    // ) {
    //     // TODO: Service에 getSettlement(settlementId) 메서드 만들어서 호출
    //     // SettlementResponse response = settlementService.getSettlement(settlementId);
    //     // return ResponseEntity.ok(response);
    // }

}