package com.jeongchongmu.vote.controller;

import com.jeongchongmu.vote.dto.CastVoteRequest;
import com.jeongchongmu.vote.dto.VoteResponse;
import com.jeongchongmu.vote.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping("/{expenseId}")
    public ResponseEntity<Long> createVote(@PathVariable Long expenseId) {
        return ResponseEntity.ok(voteService.createVote(expenseId));
    }

    @PostMapping("/cast")
    public ResponseEntity<String> castVote(@RequestBody CastVoteRequest request) {
        voteService.castVote(request);
        return ResponseEntity.ok("투표 반영 완료");
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<VoteResponse> getVoteStatus(@PathVariable Long expenseId) {
        return ResponseEntity.ok(voteService.getVoteStatus(expenseId));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<String> deleteVote(@PathVariable Long expenseId) {
        voteService.deleteVote(expenseId);
        return ResponseEntity.ok("투표가 삭제되었습니다.");
    }
}