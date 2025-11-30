package com.jeongchongmu.settlement.repository;

import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.statistics.dto.SettlementSummaryDto;
import com.jeongchongmu.statistics.dto.SettlementSummaryItemDto;
import com.jeongchongmu.statistics.dto.TopExpenseDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

// JpaRepository<관리할 엔티티, 엔티티의 ID 타입>
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    //
    // save(), findById(), delete() 등은 JpaRepository가
    // 기본으로 제공하므로 아무것도 적지 않아도 됩니다.
    //

    // (선택사항) 나중에 특정 지출(Expense) ID로 정산(Settlement)을
    // 찾아야 할 수도 있으므로, 아래 메서드를 추가해두면 유용합니다.
    Optional<Settlement> findByExpenseId(Long expenseId);


    // 1. 정산 요약 (총 횟수, 미완료 횟수)
    // 1. 정산 요약 (총 횟수, 미완료 횟수)
    // 수정됨: s.group.id -> s.expense.group.id (지출을 타고 그룹으로 이동)
    // 1. 정산 요약 (총 횟수, 미완료 횟수)
    // DB 구조: Settlement -> Expense -> Group 순으로 연결됨
    // 스키마의 created_at 컬럼은 자바 엔티티에서 createdAt 필드로 매핑된다고 가정합니다.
    @Query("SELECT new com.jeongchongmu.statistics.dto.SettlementSummaryDto(" +
            "COUNT(s), " +
            "SUM(CASE WHEN s.status <> 'COMPLETED' THEN 1L ELSE 0L END)) " +
            "FROM Settlement s " +
            "WHERE s.expense.group.id = :groupId " +
            "AND YEAR(s.createdAt) = :year " +
            "AND MONTH(s.createdAt) = :month")
    SettlementSummaryDto findMonthlySettlementSummary(@Param("groupId") Long groupId,
                                                      @Param("year") int year,
                                                      @Param("month") int month);

    @Query("SELECT new com.jeongchongmu.statistics.dto.SettlementSummaryItemDto(" +
            "s.id, s.expense.id, s.expense.title, s.expense.amount) " +
            "FROM Settlement s " +
            "WHERE s.expense.group.id = :groupId " +
            "AND YEAR(s.createdAt) = :year " +
            "AND MONTH(s.createdAt) = :month " +
            "AND s.status <> 'COMPLETED'")
    List<SettlementSummaryItemDto> findIncompletedSettlements(@Param("groupId") Long groupId,
                                                               @Param("year") int year,
                                                               @Param("month") int month);

    // [NEW] 특정 그룹에서 이미 정산이 생성된 지출의 ID 목록 조회
    // (이 리스트에 없는 지출이 바로 '미정산 지출'입니다)
    @Query("SELECT s.expense.id FROM Settlement s WHERE s.expense.group.id = :groupId")
    List<Long> findSettledExpenseIdsByGroupId(@Param("groupId") Long groupId);


}