package com.jeongchongmu.settlement.dto;

import com.jeongchongmu.settlement.entity.SettlementDetail;
import com.jeongchongmu.user.User;
import lombok.Getter;
import lombok.Builder;

@Getter
@Builder
public class SettlementDetailDto {

    private Long debtorId; // 돈 보낼 사람 ID
    private String debtorName; // 돈 보낼 사람 이름
    private Long creditorId; // 돈 받을 사람 ID
    private String creditorName; // 돈 받을 사람 이름
    private Long amount; // 금액
    private boolean isSent; // 송금 완료 여부

    private String creditorBankName;
    private String creditorAccountNumber;
    private String transferUrl; // 송금 딥링크

    // Entity(SettlementDetail)를 DTO로 변환하는 정적 메서드
    public static SettlementDetailDto from(SettlementDetail detail) {
        User creditor = detail.getCreditor();

        // 1. 은행 정보 가져오기 (User 엔티티에 이미 필드가 있다고 가정)
        String bankName = creditor.getBankName();
        String accountNumber = creditor.getAccountNumber();

        // 2. 토스(Toss) 딥링크 생성 (예시 포맷)
        // 실제로는 '카카오뱅크', '토스뱅크' 등 은행 코드에 맞춰 변환이 필요할 수 있지만,
        // 여기서는 가장 단순한 형태의 딥링크 문자열을 만듭니다.
        String generatedUrl = generateTossDeepLink(bankName, accountNumber, detail.getAmount());

        return SettlementDetailDto.builder()
                .debtorId(detail.getDebtor().getId())
                .debtorName(detail.getDebtor().getName()) // User 엔티티에 getName()이 있다고 가정
                .creditorId(detail.getCreditor().getId())
                .creditorName(detail.getCreditor().getName()) // User 엔티티에 getName()이 있다고 가정
                .amount(detail.getAmount())
                .isSent(detail.isSent())
                .creditorBankName(bankName)
                .creditorAccountNumber(accountNumber)
                .transferUrl(generatedUrl)
                .build();
    }
    // 딥링크 생성 헬퍼 메서드
    private static String generateTossDeepLink(String bankName, String accountNumber, Long amount) {
        if (bankName == null || accountNumber == null) {
            return null; // 계좌 정보가 없으면 링크 생성 불가
        }
        // 토스 송금 링크 포맷 (예시: supertoss://send?bank=토스뱅크&accountNo=1234&amount=10000)
        // 실제 앱에서는 URL Encoding 처리가 필요할 수 있습니다.
        return String.format("supertoss://send?bank=%s&accountNo=%s&amount=%d",
                bankName, accountNumber, amount);
    }
}