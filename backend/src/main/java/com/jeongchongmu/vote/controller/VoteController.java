package com.jeongchongmu.vote.controller;

import com.jeongchongmu.user.User;
import com.jeongchongmu.vote.dto.CastVoteRequest;
import com.jeongchongmu.vote.dto.CreateVoteRequest;
import com.jeongchongmu.vote.dto.ExtendVoteRequest;
import com.jeongchongmu.vote.dto.VoteResponse;
import com.jeongchongmu.vote.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    /**
     * 투표 생성
     * - 그룹 멤버만 가능
     */
    @PostMapping("/{expenseId}")
    public ResponseEntity<Long> createVote(
            @PathVariable Long expenseId,
            @Valid @RequestBody(required = false) CreateVoteRequest request,
            @AuthenticationPrincipal User user) {

        Long voteId = voteService.createVote(expenseId, request, user);
        return ResponseEntity.ok(voteId);
    }

    /**
     * 투표하기 (토글 방식)
     * - 그룹 멤버만 가능
     * - 마감 전에만 가능
     */
    @PostMapping("/cast")
    public ResponseEntity<String> castVote(
            @Valid @RequestBody CastVoteRequest request,
            @AuthenticationPrincipal User user) {

        voteService.castVote(request, user);
        return ResponseEntity.ok("투표 반영 완료");
    }

    /**
     * 투표 현황 조회
     * - 그룹 멤버만 가능
     */
    @GetMapping("/{expenseId}")
    public ResponseEntity<VoteResponse> getVoteStatus(
            @PathVariable Long expenseId,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(voteService.getVoteStatus(expenseId, user));
    }

    /**
     * 투표 즉시 마감
     * - 그룹 OWNER만 가능
     * - 정산 시작 전에만 가능
     */
    @PostMapping("/{expenseId}/close")
    public ResponseEntity<String> closeVote(
            @PathVariable Long expenseId,
            @AuthenticationPrincipal User user) {

        voteService.closeVote(expenseId, user);
        return ResponseEntity.ok("투표가 마감되었습니다.");
    }

    /**
     * 투표 기간 연장
     * - 그룹 OWNER만 가능
     * - 정산 시작 전에만 가능
     */
    @PostMapping("/{expenseId}/extend")
    public ResponseEntity<String> extendVote(
            @PathVariable Long expenseId,
            @Valid @RequestBody ExtendVoteRequest request,
            @AuthenticationPrincipal User user) {

        voteService.extendVote(expenseId, request, user);
        return ResponseEntity.ok("투표 기간이 연장되었습니다.");
    }
}