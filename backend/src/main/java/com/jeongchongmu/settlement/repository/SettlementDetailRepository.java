package com.jeongchongmu.settlement.repository;

import com.jeongchongmu.settlement.entity.SettlementDetail;
import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepository<관리할 엔티티, 엔티티의 ID 타입>
public interface SettlementDetailRepository extends JpaRepository<SettlementDetail, Long> {

    // 여기도 마찬가지로 기본 메서드 외에
    // 특별히 추가할 것은 당장 없습니다.

}