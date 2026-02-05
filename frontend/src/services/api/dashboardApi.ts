import apiClient from './apiClient';
import { DashboardResponseDto } from '../../types/dashboard.types';

/**
 * 대시보드 데이터 조회
 * 메인 화면에 필요한 모든 데이터를 한 번에 가져옵니다.
 *
 * @returns Promise<DashboardResponseDto> - 대시보드 데이터
 * @throws {Error} 대시보드 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const dashboard = await getDashboard();
 *   console.log("그룹 목록:", dashboard.groups);
 *   console.log("이번 달 지출:", dashboard.thisMonthExpense);
 *   console.log("최근 활동:", dashboard.recentActivities);
 *   console.log("받을 돈:", dashboard.toReceive);
 *   console.log("보낼 돈:", dashboard.toSend);
 * } catch (error) {
 *   console.error("대시보드 조회 실패:", error);
 * }
 * ```
 */
export const getDashboard = async (): Promise<DashboardResponseDto> => {
  try {
    const response = await apiClient.get<DashboardResponseDto>('/api/dashboard');
    return response.data;
  } catch (error: any) {
    console.error('대시보드 조회 API 에러:', error.response?.data || error.message);

    throw new Error(
      error.response?.data?.message || '대시보드 데이터를 불러오는데 실패했습니다.'
    );
  }
};
