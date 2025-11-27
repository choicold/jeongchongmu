package com.jeongchongmu.settlement.controller;

import com.jeongchongmu.settlement.dto.SettlementCreateRequest;
import com.jeongchongmu.settlement.dto.SettlementResponse;
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
            @RequestBody SettlementCreateRequest request,
            @AuthenticationPrincipal User user // Spring Security 인증 유저 주입
    ) {
        // 인증된 유저(user)가 정산을 요청함
        SettlementResponse response = settlementService.createSettlement(request, user);

        // "/api/settlements"로 오는 요청을 이 컨트롤러가 처리
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