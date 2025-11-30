import apiClient from './apiClient';
import { MonthlyStatisticsResponseDto } from '../../types/statistics.types';

/**
 * 특정 그룹의 월별 통계를 조회합니다.
 * 총 지출 금액, 카테고리별 지출, 연간 추이 등을 확인할 수 있습니다.
 *
 * @param groupId - 통계를 조회할 그룹 ID
 * @param year - 조회 연도 (예: 2025)
 * @param month - 조회 월 (1~12)
 * @returns Promise<MonthlyStatisticsResponseDto> - 월별 통계 데이터
 *
 * @throws {Error} 통계 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const stats = await getMonthlyStatistics(1, 2025, 1);
 *   console.log("총 지출:", stats.totalExpenseAmount);
 *   console.log("지출 횟수:", stats.totalExpenseCount);
 *   console.log("카테고리별:", stats.categories);
 *   console.log("연간 추이:", stats.yearlyStatistics);
 * } catch (error) {
 *   console.error("통계 조회 실패:", error);
 * }
 * ```
 */
export const getMonthlyStatistics = async (
  groupId: number,
  year: number,
  month: number
): Promise<MonthlyStatisticsResponseDto> => {
  try {
    // 월은 1~12 범위 검증
    if (month < 1 || month > 12) {
      throw new Error('월은 1~12 사이의 값이어야 합니다.');
    }

    const response = await apiClient.get<MonthlyStatisticsResponseDto>(
      `/api/groups/${groupId}/statistics?year=${year}&month=${month}`
    );
    return response.data;
  } catch (error: any) {
    console.error('통계 조회 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    throw new Error(
      error.response?.data?.message || '통계 조회에 실패했습니다.'
    );
  }
};

/**
 * 특정 그룹의 연간 통계를 조회합니다.
 *
 * @param groupId - 통계를 조회할 그룹 ID
 * @param year - 조회 연도 (예: 2025)
 * @returns Promise<MonthlyStatisticsResponseDto> - 연간 통계 데이터
 *
 * @throws {Error} 통계 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const yearlyStats = await getYearlyStatistics(1, 2025);
 *   console.log("1~12월 지출:", yearlyStats.yearlyStatistics);
 * } catch (error) {
 *   console.error("연간 통계 조회 실패:", error);
 * }
 * ```
 */
export const getYearlyStatistics = async (
  groupId: number,
  year: number
): Promise<MonthlyStatisticsResponseDto> => {
  try {
    // 연간 통계는 month=1로 조회 (백엔드에서 연간 데이터를 yearlyStatistics 필드에 포함)
    const response = await apiClient.get<MonthlyStatisticsResponseDto>(
      `/api/groups/${groupId}/statistics?year=${year}&month=1`
    );
    return response.data;
  } catch (error: any) {
    console.error('연간 통계 조회 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '연간 통계 조회에 실패했습니다.'
    );
  }
};
