import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { CategorySummaryDto } from '../../types/statistics.types';
import { COLORS } from '../../constants/colors';

/**
 * CategoryPieChart Props
 */
export interface CategoryPieChartProps {
  /** 카테고리별 지출 요약 */
  categories: CategorySummaryDto[];
}

/**
 * 차트 색상 팔레트
 */
const CHART_COLORS = [
  '#007AFF', // 파란색 (Primary)
  '#5856D6', // 보라색 (Secondary)
  '#34C759', // 녹색 (Success)
  '#FF9500', // 주황색 (Warning)
  '#FF3B30', // 빨간색 (Error)
  '#AF52DE', // 자주색
  '#00C7BE', // 청록색
  '#FF2D55', // 분홍색
  '#5AC8FA', // 하늘색
  '#FFCC00', // 노란색
];

/**
 * CategoryPieChart 컴포넌트
 *
 * 카테고리(태그)별 지출을 파이 차트로 표시합니다.
 * react-native-chart-kit의 PieChart를 사용합니다.
 *
 * @example
 * ```tsx
 * <CategoryPieChart
 *   categories={[
 *     { tagName: "식비", totalAmount: 300000 },
 *     { tagName: "교통비", totalAmount: 150000 },
 *   ]}
 * />
 * ```
 */
export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categories,
}) => {
  const screenWidth = Dimensions.get('window').width;

  // 데이터가 없는 경우
  if (!categories || categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>카테고리별 지출 데이터가 없습니다</Text>
      </View>
    );
  }

  // 상위 5개 카테고리만 표시 (기타로 묶기)
  const topCategories = [...categories]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const others = categories
    .slice(5)
    .reduce((sum, cat) => sum + cat.totalAmount, 0);

  const displayCategories =
    others > 0
      ? [...topCategories, { tagName: '기타', totalAmount: others }]
      : topCategories;

  // 총 금액 계산
  const totalAmount = categories.reduce(
    (sum, cat) => sum + cat.totalAmount,
    0
  );

  // 차트 데이터 변환
  const chartData = displayCategories.map((cat, index) => ({
    name: cat.tagName,
    amount: cat.totalAmount,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: COLORS.text.secondary,
    legendFontSize: 13,
  }));

  // 차트 설정
  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>카테고리별 지출</Text>

      {/* 파이 차트 */}
      <PieChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute // 절대값 표시
        hasLegend
      />

      {/* 범례 (추가 정보) */}
      <View style={styles.legendContainer}>
        {displayCategories.map((cat, index) => {
          const percentage = ((cat.totalAmount / totalAmount) * 100).toFixed(1);
          return (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      CHART_COLORS[index % CHART_COLORS.length],
                  },
                ]}
              />
              <Text style={styles.legendName}>{cat.tagName}</Text>
              <Text style={styles.legendValue}>
                {cat.totalAmount.toLocaleString()}원
              </Text>
              <Text style={styles.legendPercent}>({percentage}%)</Text>
            </View>
          );
        })}
      </View>

      {/* 총계 */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>총 지출</Text>
        <Text style={styles.totalValue}>
          {totalAmount.toLocaleString()}원
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginRight: 8,
  },
  legendPercent: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.border.default,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
