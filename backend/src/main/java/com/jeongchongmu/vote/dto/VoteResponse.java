package com.jeongchongmu.vote.dto;

import com.jeongchongmu.vote.entity.Vote;
import lombok.Builder;
import lombok.Getter;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class VoteResponse {
    private Long voteId;
    private Long expenseId;
    private boolean isClosed;
    private List<VoteOptionDto> options;

    @Getter
    @Builder
    public static class VoteOptionDto {
        private Long optionId;
        private String itemName;
        private Long price;
        private List<Long> votedUserIds; // 이 메뉴를 선택한 사람들
    }

    public static VoteResponse from(Vote vote, List<com.jeongchongmu.vote.entity.UserVote> allUserVotes) {
        return VoteResponse.builder()
                .voteId(vote.getId())
                .expenseId(vote.getExpense().getId())
                .isClosed(vote.isClosed())
                .options(vote.getOptions().stream().map(option -> {
                    List<Long> voterIds = allUserVotes.stream()
                            .filter(uv -> uv.getVoteOption().getId().equals(option.getId()))
                            .map(uv -> uv.getUser().getId())
                            .collect(Collectors.toList());

                    return VoteOptionDto.builder()
                            .optionId(option.getId())
                            .itemName(option.getExpenseItem().getName())
                            .price(option.getExpenseItem().getPrice().longValue()) // BigDecimal -> Long
                            .votedUserIds(voterIds)
                            .build();
                }).collect(Collectors.toList()))
                .build();
    }
}