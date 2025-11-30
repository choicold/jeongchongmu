// 통계 관련 타입 정의

/**
 * 카테고리(태그)별 지출 요약 DTO
 */
export interface CategorySummaryDto {
  tagName: string;
  totalAmount: number;
}

/**
 * 최대 지출 항목 DTO
 */
export interface TopExpenseDto {
  id: number;
  title: string;
  amount: number;
}

/**
 * 정산 요약 항목 DTO
 */
export interface SettlementSummaryItemDto {
  settlementId: number;
  expenseId: number;
  title: string;
  amount: number;
}

/**
 * 월별 통계 응답 DTO
 */
export interface MonthlyStatisticsResponseDto {
  totalExpenseAmount: number;
  totalExpenseCount: number;
  categories: CategorySummaryDto[];
  topExpense?: TopExpenseDto;
  totalSettlementCount: number;
  notCompletedSettlementCount: number;
  incompletedSettlements: SettlementSummaryItemDto[];
  yearlyStatistics: number[]; // 1~12월 지출 금액 배열
}
