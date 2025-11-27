package com.jeongchongmu.settlement.repository;

import com.jeongchongmu.settlement.entity.SettlementDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SettlementDetailRepository extends JpaRepository<SettlementDetail, Long> {

    /**
     * 특정 사용자가 보내야 할 미완료 정산 목록 조회
     */
    @Query("SELECT sd FROM SettlementDetail sd " +
            "JOIN FETCH sd.settlement s " +
            "JOIN FETCH s.expense e " +
            "JOIN FETCH sd.creditor " +
            "WHERE sd.debtor.id = :debtorId AND sd.isSent = false")
    List<SettlementDetail> findByDebtorIdAndIsSentFalse(@Param("debtorId") Long debtorId);

    /**
     * 특정 사용자가 받아야 할 미완료 정산 목록 조회
     */
    @Query("SELECT sd FROM SettlementDetail sd " +
            "JOIN FETCH sd.settlement s " +
            "JOIN FETCH s.expense e " +
            "JOIN FETCH sd.debtor " +
            "WHERE sd.creditor.id = :creditorId AND sd.isSent = false")
    List<SettlementDetail> findByCreditorIdAndIsSentFalse(@Param("creditorId") Long creditorId);

    /**
     * 특정 정산의 모든 상세 내역 조회
     */
    List<SettlementDetail> findBySettlementId(Long settlementId);
}