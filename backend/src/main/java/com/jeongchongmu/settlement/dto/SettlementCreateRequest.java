package com.jeongchongmu.settlement.dto;

import com.jeongchongmu.settlement.enums.SettlementMethod;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class SettlementCreateRequest {

    // 어떤 지출(Expense)에 대한 정산인지 ID를 받습니다.
    private Long expenseId;

    // 어떤 정산 방식인지 Enum으로 받습니다.
    private SettlementMethod method;

    // ----- '직접 정산(DIRECT)'일 때만 사용하는 데이터 -----
    // (예: [{userId: 1, amount: 10000}, {userId: 2, amount: 15000}])
    private List<DirectSettlementEntry> directEntries;

    // ----- '퍼센트 정산(PERCENT)'일 때만 사용하는 데이터 -----
    // (예: [{userId: 1, ratio: 60}, {userId: 2, ratio: 40}])
    private List<PercentSettlementEntry> percentEntries;

    private List<Long> participantUserIds;

}