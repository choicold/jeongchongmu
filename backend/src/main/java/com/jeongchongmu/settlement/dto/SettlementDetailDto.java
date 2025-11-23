package com.jeongchongmu.settlement.dto;

import com.jeongchongmu.settlement.entity.SettlementDetail;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class SettlementDetailDto {

    private Long debtorId; // 돈 보낼 사람 ID
    private String debtorName; // 돈 보낼 사람 이름
    private Long creditorId; // 돈 받을 사람 ID
    private String creditorName; // 돈 받을 사람 이름
    private Long amount; // 금액
    private boolean isSent; // 송금 완료 여부

    // Entity(SettlementDetail)를 DTO로 변환하는 정적 메서드
    public static SettlementDetailDto from(SettlementDetail detail) {
        return SettlementDetailDto.builder()
                .debtorId(detail.getDebtor().getId())
                .debtorName(detail.getDebtor().getName()) // User 엔티티에 getName()이 있다고 가정
                .creditorId(detail.getCreditor().getId())
                .creditorName(detail.getCreditor().getName()) // User 엔티티에 getName()이 있다고 가정
                .amount(detail.getAmount())
                .isSent(detail.isSent())
                .build();
    }
}