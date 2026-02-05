import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as statisticsApi from '../services/api/statisticsApi';

/**
 * 통계 쿼리 키
 */
export const statisticsKeys = {
  all: ['statistics'] as const,
  personal: (year: number, month: number) =>
    [...statisticsKeys.all, 'personal', year, month] as const,
  group: (groupId: number, year: number, month: number) =>
    [...statisticsKeys.all, 'group', groupId, year, month] as const,
};

/**
 * 개인 전체 통계를 조회하는 훅
 *
 * @param year - 조회할 연도
 * @param month - 조회할 월 (1-12)
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = usePersonalStatistics(2025, 12);
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <View>
 *     <Text>총 지출: {data.totalExpenseAmount}원</Text>
 *     {data.categories.map(cat => (
 *       <CategoryCard key={cat.tagName} {...cat} />
 *     ))}
 *   </View>
 * );
 * ```
 */
export const usePersonalStatistics = (year: number, month: number) => {
  return useQuery({
    queryKey: statisticsKeys.personal(year, month),
    queryFn: () => statisticsApi.getUserTotalStatistics(year, month),
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 그룹별 통계를 조회하는 훅
 *
 * @param groupId - 그룹 ID
 * @param year - 조회할 연도
 * @param month - 조회할 월 (1-12)
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useGroupStatistics(1, 2025, 12);
 * ```
 */
export const useGroupStatistics = (
  groupId: number,
  year: number,
  month: number
) => {
  return useQuery({
    queryKey: statisticsKeys.group(groupId, year, month),
    queryFn: () => statisticsApi.getMonthlyStatistics(groupId, year, month),
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 통계 데이터를 무효화하는 훅
 * 지출 생성/수정/삭제 후 호출하여 통계를 새로고침합니다.
 *
 * @example
 * ```typescript
 * const invalidateStatistics = useInvalidateStatistics();
 *
 * // 지출 생성 후
 * await createExpense(data);
 * invalidateStatistics(); // 모든 통계 자동 새로고침
 * ```
 */
export const useInvalidateStatistics = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
  };
};
