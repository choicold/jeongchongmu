import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../../constants/colors';

/**
 * MonthlyChart Props
 */
export interface MonthlyChartProps {
  /** 1~12월 지출 금액 배열 */
  yearlyStatistics: number[];
  /** 현재 선택된 연도 */
  year: number;
}

/**
 * MonthlyChart 컴포넌트
 *
 * 월별 지출을 라인 차트로 표시합니다.
 * react-native-chart-kit의 LineChart를 사용합니다.
 *
 * @example
 * ```tsx
 * <MonthlyChart
 *   yearlyStatistics={[100000, 150000, 200000, ...]}
 *   year={2025}
 * />
 * ```
 */
export const MonthlyChart: React.FC<MonthlyChartProps> = ({
  yearlyStatistics,
  year,
}) => {
  const screenWidth = Dimensions.get('window').width;

  // 차트 데이터
  const chartData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    datasets: [
      {
        data: yearlyStatistics.length === 12 ? yearlyStatistics : Array(12).fill(0),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // COLORS.primary의 RGB
        strokeWidth: 2,
      },
    ],
  };

  // 차트 설정
  const chartConfig = {
    backgroundColor: COLORS.background.default,
    backgroundGradientFrom: COLORS.background.default,
    backgroundGradientTo: COLORS.background.secondary,
    decimalPlaces: 0, // 소수점 자릿수
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(60, 60, 67, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // 실선
      stroke: COLORS.border.light,
      strokeWidth: 1,
    },
  };

  // 데이터가 없는 경우
  if (yearlyStatistics.length === 0 || yearlyStatistics.every((v) => v === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>지출 데이터가 없습니다</Text>
      </View>
    );
  }

  // 최대값 계산 (Y축 스케일링)
  const maxValue = Math.max(...yearlyStatistics, 1);

  // Y축 레이블 포맷팅 함수 - 금액에 따라 적절한 단위 표시
  const formatYLabel = (value: string): string => {
    const num = parseFloat(value);

    // 100만원 이상: "백만" 단위
    if (maxValue >= 1000000) {
      const millions = num / 1000000;
      if (millions >= 100) {
        return `${Math.round(millions / 10) * 10}백만`;
      } else if (millions >= 10) {
        return `${Math.round(millions)}백만`;
      } else if (millions >= 1) {
        return `${Math.round(millions * 10) / 10}백만`;
      }
      return `${Math.round(num / 10000)}만`;
    }
    // 10만원 이상: "만원" 단위
    else if (maxValue >= 100000) {
      return `${Math.round(num / 10000)}만`;
    }
    // 1만원 이상: "만원" 단위 (소수점 1자리)
    else if (maxValue >= 10000) {
      return `${Math.round(num / 1000) / 10}만`;
    }
    // 1천원 이상: "천원" 단위
    else if (maxValue >= 1000) {
      return `${Math.round(num / 1000)}천`;
    }
    // 1천원 미만: 그대로 표시
    return `${Math.round(num)}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{year}년 월별 지출</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 64} // 양쪽 패딩 32px씩
        height={220}
        chartConfig={chartConfig}
        bezier // 곡선 라인
        style={styles.chart}
        formatYLabel={formatYLabel}
        withInnerLines
        withOuterLines
        withVerticalLines={false}
        withHorizontalLines
        withVerticalLabels
        withHorizontalLabels
        fromZero
      />
      <Text style={styles.subtitle}>
        총 지출: {yearlyStatistics.reduce((a, b) => a + b, 0).toLocaleString()}원
      </Text>
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
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
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
});
