import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as dashboardApi from '../services/api/dashboardApi';

/**
 * 대시보드 쿼리 키
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  dashboard: () => [...dashboardKeys.all] as const,
};

/**
 * 대시보드 데이터를 조회하는 훅
 *
 * @returns {object} - 대시보드 데이터 및 상태
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useDashboard();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage />;
 *
 * return (
 *   <View>
 *     <Text>{data.thisMonthExpense}원</Text>
 *     {data.recentActivities.map(activity => (
 *       <ActivityCard key={activity.expenseId} {...activity} />
 *     ))}
 *   </View>
 * );
 * ```
 */
export const useDashboard = () => {
  return useQuery({
    queryKey: dashboardKeys.dashboard(),
    queryFn: dashboardApi.getDashboard,
    staleTime: 2 * 60 * 1000, // 2분: 이 시간 동안은 데이터가 신선하다고 판단
    gcTime: 5 * 60 * 1000, // 5분: 사용하지 않는 캐시 데이터 보관 시간
  });
};

/**
 * 대시보드 데이터를 무효화하는 훅
 * 지출/정산 생성/수정/삭제 후 호출하여 대시보드를 새로고침합니다.
 *
 * @example
 * ```typescript
 * const invalidateDashboard = useInvalidateDashboard();
 *
 * // 지출 생성 후
 * await createExpense(data);
 * invalidateDashboard(); // 대시보드 자동 새로고침
 * ```
 */
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.dashboard() });
  };
};
