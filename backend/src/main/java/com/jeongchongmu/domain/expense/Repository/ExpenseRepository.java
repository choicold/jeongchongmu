package com.jeongchongmu.domain.expense.Repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.statistics.dto.CategorySummaryDto;
import com.jeongchongmu.statistics.dto.ExpenseSummaryDto;
import com.jeongchongmu.statistics.dto.MonthlyExpenseStatDto;
import com.jeongchongmu.statistics.dto.TopExpenseDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    //저장, 삭제는 상속 받은거 쓰면 됨
    //.save(), .deleteById(id), .delete(expense) 등등

    //그룹별 정산조회 (Payer와 Participants 모두 Fetch Join)
    @Query("SELECT DISTINCT e FROM Expense e " +
            "LEFT JOIN FETCH e.payer " +
            "LEFT JOIN FETCH e.participants p " +
            "LEFT JOIN FETCH p.user " +
            "WHERE e.group = :group ORDER BY e.expenseData DESC")
    List<Expense> findByGroupWithPayer(@Param("group") Group group);

    //특정 정산 + item + 참여인원 조회
    @Query("SELECT e FROM Expense e " +
            "LEFT JOIN FETCH e.items " +
            "LEFT JOIN FETCH e.participants p " +
            "LEFT JOIN FETCH p.user " + // 참여자의 상세 User 정보까지 한 번에 가져옵니다.
            "LEFT JOIN FETCH e.tags " + // tag 정보
            "WHERE e.id = :expenseId")
    Optional<Expense> findByIdWithDetails(@Param("expenseId")Long expenseId);




    // 1. 월간 지출 요약 (총액, 횟수, 최대금액)
    @Query("SELECT new com.jeongchongmu.statistics.dto.ExpenseSummaryDto(" +
            "SUM(e.amount), COUNT(e), MAX(e.amount)) " +
            "FROM Expense e " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month")
    ExpenseSummaryDto findMonthlyExpenseSummary(@Param("groupId") Long groupId,
                                                @Param("year") int year,
                                                @Param("month") int month);


    // 2. 카테고리(태그)별 지출 통계
    @Query("SELECT new com.jeongchongmu.statistics.dto.CategorySummaryDto(" +
            "t.name, SUM(e.amount)) " +
            "FROM Expense e " +
            "JOIN e.tags t " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month " +
            "GROUP BY t.name")
    List<CategorySummaryDto> findMonthlyCategoryStatistics(@Param("groupId") Long groupId,
                                                           @Param("year") int year,
                                                           @Param("month") int month);


    // 3. 가장 금액이 큰 지출 1건 상세 정보
    @Query("SELECT new com.jeongchongmu.statistics.dto.TopExpenseDto(" +
            "e.id, e.title, e.amount) " +
            "FROM Expense e " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month " +
            "ORDER BY e.amount DESC")
    List<TopExpenseDto> findTopExpense(@Param("groupId") Long groupId,
                                       @Param("year") int year,
                                       @Param("month") int month,
                                       Pageable pageable);

    // 4. 연간 월별 합계
    @Query("SELECT new com.jeongchongmu.statistics.dto.MonthlyExpenseStatDto(" +
            "MONTH(e.expenseData), SUM(e.amount)) " +
            "FROM Expense e " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "GROUP BY MONTH(e.expenseData)")
    List<MonthlyExpenseStatDto> findYearlyStatistics(@Param("groupId") Long groupId,
                                                     @Param("year") int year);

    //이미 등록된 영수증인지 아닌지.
    boolean existsByReceiptUrl(String receiptUrl);

    // 5. 사용자별 월간 지출 통계 (정산 기반)
    // 로직:
    // 1. 내가 결제자인 경우: 정산이 있으면 내 채무만, 정산이 없으면 전체 금액
    // 2. 내가 참여자인 경우: 정산이 있으면 내 채무만, 정산이 없으면 제외
    @Query("SELECT COALESCE(SUM(" +
            "CASE " +
            // 정산이 있고 내가 채무자인 경우: 내 채무 금액만
            "WHEN e.id IN (SELECT s.expense.id FROM Settlement s JOIN s.details sd WHERE sd.debtor.id = :userId) " +
            "THEN (SELECT COALESCE(SUM(sd2.amount), 0) FROM SettlementDetail sd2 WHERE sd2.settlement.expense.id = e.id AND sd2.debtor.id = :userId) " +
            // 정산이 없고 내가 결제자인 경우: 전체 금액
            "WHEN e.id NOT IN (SELECT s2.expense.id FROM Settlement s2) AND e.payer.id = :userId " +
            "THEN e.amount " +
            // 그 외의 경우: 0
            "ELSE 0 " +
            "END), 0) " +
            "FROM Expense e " +
            "LEFT JOIN e.participants p " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month " +
            "AND (e.payer.id = :userId OR p.user.id = :userId)")
    Long findUserMonthlyExpenseTotal(@Param("groupId") Long groupId,
                                      @Param("year") int year,
                                      @Param("month") int month,
                                      @Param("userId") Long userId);

    // 6. 사용자별 카테고리 통계 (정산 기반)
    @Query("SELECT new com.jeongchongmu.statistics.dto.CategorySummaryDto(" +
            "t.name, " +
            "SUM(CASE " +
            "WHEN e.id IN (SELECT s.expense.id FROM Settlement s JOIN s.details sd WHERE sd.debtor.id = :userId) " +
            "THEN (SELECT COALESCE(SUM(sd2.amount), 0) FROM SettlementDetail sd2 WHERE sd2.settlement.expense.id = e.id AND sd2.debtor.id = :userId) " +
            "WHEN e.id NOT IN (SELECT s2.expense.id FROM Settlement s2) AND e.payer.id = :userId " +
            "THEN e.amount " +
            "ELSE 0 " +
            "END)) " +
            "FROM Expense e " +
            "LEFT JOIN e.participants p " +
            "JOIN e.tags t " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND MONTH(e.expenseData) = :month " +
            "AND (e.payer.id = :userId OR p.user.id = :userId) " +
            "GROUP BY t.name")
    List<CategorySummaryDto> findUserMonthlyCategoryStatistics(@Param("groupId") Long groupId,
                                                                @Param("year") int year,
                                                                @Param("month") int month,
                                                                @Param("userId") Long userId);

    // 7. 사용자별 연간 통계 (정산 기반)
    @Query("SELECT new com.jeongchongmu.statistics.dto.MonthlyExpenseStatDto(" +
            "MONTH(e.expenseData), " +
            "SUM(CASE " +
            "WHEN e.id IN (SELECT s.expense.id FROM Settlement s JOIN s.details sd WHERE sd.debtor.id = :userId) " +
            "THEN (SELECT COALESCE(SUM(sd2.amount), 0) FROM SettlementDetail sd2 WHERE sd2.settlement.expense.id = e.id AND sd2.debtor.id = :userId) " +
            "WHEN e.id NOT IN (SELECT s2.expense.id FROM Settlement s2) AND e.payer.id = :userId " +
            "THEN e.amount " +
            "ELSE 0 " +
            "END)) " +
            "FROM Expense e " +
            "LEFT JOIN e.participants p " +
            "WHERE e.group.id = :groupId " +
            "AND YEAR(e.expenseData) = :year " +
            "AND (e.payer.id = :userId OR p.user.id = :userId) " +
            "GROUP BY MONTH(e.expenseData)")
    List<MonthlyExpenseStatDto> findUserYearlyStatistics(@Param("groupId") Long groupId,
                                                          @Param("year") int year,
                                                          @Param("userId") Long userId);

    // 8. 개인 전체 월간 지출 통계 (모든 그룹 합산) - Native Query로 최적화
    @Query(value =
            "SELECT COALESCE(SUM(" +
            "  CASE " +
            "    WHEN EXISTS (SELECT 1 FROM settlement s WHERE s.expense_id = e.id) " +
            "    THEN COALESCE((SELECT SUM(sd.amount) FROM settlement_detail sd " +
            "                   JOIN settlement s2 ON s2.id = sd.settlement_id " +
            "                   WHERE s2.expense_id = e.id AND sd.debtor_id = :userId), 0) " +
            "    WHEN e.payer_id = :userId THEN e.amount " +
            "    ELSE 0 " +
            "  END), 0) " +
            "FROM expense e " +
            "LEFT JOIN expense_participant ep ON ep.expense_id = e.id " +
            "WHERE YEAR(e.expense_data) = :year " +
            "AND MONTH(e.expense_data) = :month " +
            "AND (e.payer_id = :userId OR ep.user_id = :userId)",
            nativeQuery = true)
    Long findUserTotalMonthlyExpense(@Param("year") int year,
                                      @Param("month") int month,
                                      @Param("userId") Long userId);

    // 9. 개인 전체 카테고리 통계 (모든 그룹 합산) - Native Query로 최적화
    @Query(value =
            "SELECT t.name as tagName, " +
            "  COALESCE(SUM(" +
            "    CASE " +
            "      WHEN EXISTS (SELECT 1 FROM settlement s WHERE s.expense_id = e.id) " +
            "      THEN COALESCE((SELECT SUM(sd.amount) FROM settlement_detail sd " +
            "                     JOIN settlement s2 ON s2.id = sd.settlement_id " +
            "                     WHERE s2.expense_id = e.id AND sd.debtor_id = :userId), 0) " +
            "      WHEN e.payer_id = :userId THEN e.amount " +
            "      ELSE 0 " +
            "    END), 0) as totalAmount " +
            "FROM expense e " +
            "LEFT JOIN expense_participant ep ON ep.expense_id = e.id " +
            "JOIN expense_tag et ON et.expense_id = e.id " +
            "JOIN tag t ON t.id = et.tag_id " +
            "WHERE YEAR(e.expense_data) = :year " +
            "AND MONTH(e.expense_data) = :month " +
            "AND (e.payer_id = :userId OR ep.user_id = :userId) " +
            "GROUP BY t.name",
            nativeQuery = true)
    List<CategorySummaryDto> findUserTotalMonthlyCategoryStatistics(@Param("year") int year,
                                                                     @Param("month") int month,
                                                                     @Param("userId") Long userId);

    // 10. 개인 전체 연간 통계 (모든 그룹 합산) - Native Query로 최적화
    @Query(value =
            "SELECT MONTH(e.expense_data) as month, " +
            "  COALESCE(SUM(" +
            "    CASE " +
            "      WHEN EXISTS (SELECT 1 FROM settlement s WHERE s.expense_id = e.id) " +
            "      THEN COALESCE((SELECT SUM(sd.amount) FROM settlement_detail sd " +
            "                     JOIN settlement s2 ON s2.id = sd.settlement_id " +
            "                     WHERE s2.expense_id = e.id AND sd.debtor_id = :userId), 0) " +
            "      WHEN e.payer_id = :userId THEN e.amount " +
            "      ELSE 0 " +
            "    END), 0) as amount " +
            "FROM expense e " +
            "LEFT JOIN expense_participant ep ON ep.expense_id = e.id " +
            "WHERE YEAR(e.expense_data) = :year " +
            "AND (e.payer_id = :userId OR ep.user_id = :userId) " +
            "GROUP BY MONTH(e.expense_data)",
            nativeQuery = true)
    List<MonthlyExpenseStatDto> findUserTotalYearlyStatistics(@Param("year") int year,
                                                               @Param("userId") Long userId);

    // 11. 대시보드용: 사용자의 최근 지출 목록 (정산 정보 포함)
    @Query("SELECT DISTINCT e FROM Expense e " +
            "LEFT JOIN FETCH e.payer " +
            "LEFT JOIN FETCH e.participants p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH e.settlement s " +
            "WHERE (e.payer.id = :userId OR p.user.id = :userId) " +
            "ORDER BY e.expenseData DESC")
    List<Expense> findRecentExpensesByUser(@Param("userId") Long userId, Pageable pageable);
}
