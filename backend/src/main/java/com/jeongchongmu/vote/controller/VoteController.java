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

    @PostMapping("/{expenseId}")//투표 만들기
    public ResponseEntity<Long> createVote(@PathVariable Long expenseId) {
        return ResponseEntity.ok(voteService.createVote(expenseId));///투표 아무나 만들 수 있는거 아닌가요?
    }

    @PostMapping("/cast")//투표하기
    public ResponseEntity<String> castVote(@RequestBody CastVoteRequest request) {/// CastVoteRequest에 id빼고 security에게 주입 받느건 어때?
        voteService.castVote(request);
        return ResponseEntity.ok("투표 반영 완료");
    }

    @GetMapping("/{expenseId}")//투표현황
    public ResponseEntity<VoteResponse> getVoteStatus(@PathVariable Long expenseId) {/// 아무나 다 볼 수 있잖아요
        return ResponseEntity.ok(voteService.getVoteStatus(expenseId));
    }
}