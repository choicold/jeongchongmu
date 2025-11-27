package com.jeongchongmu.vote.dto;

import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.entity.UserVote;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class VoteResponse {
    private Long voteId;
    private Long expenseId;
    private LocalDateTime closeAt;
    private boolean isClosed;
    private List<VoteOptionDto> options;

    @Getter
    @Builder
    public static class VoteOptionDto {
        private Long optionId;
        private String itemName;
        private Long price;
        private List<Long> votedUserIds;
    }

    public static VoteResponse from(Vote vote, List<UserVote> allUserVotes) {
        return VoteResponse.builder()
                .voteId(vote.getId())
                .expenseId(vote.getExpense().getId())
                .closeAt(vote.getCloseAt())
                .isClosed(vote.isClosed())
                .options(vote.getOptions().stream().map(option -> {
                    List<Long> voterIds = allUserVotes.stream()
                            .filter(uv -> uv.getVoteOption().getId().equals(option.getId()))
                            .map(uv -> uv.getUser().getId())
                            .collect(Collectors.toList());

                    return VoteOptionDto.builder()
                            .optionId(option.getId())
                            .itemName(option.getExpenseItem().getName())
                            .price(option.getExpenseItem().getPrice())
                            .votedUserIds(voterIds)
                            .build();
                }).collect(Collectors.toList()))
                .build();
    }
}