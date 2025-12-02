import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as statisticsApi from '../../services/api/statisticsApi';
import * as groupApi from '../../services/api/groupApi';
import { MonthlyStatisticsResponseDto, CategorySummaryDto } from '../../types/statistics.types';
import { GroupDto } from '../../types/group.types';
import { COLORS } from '../../constants/colors';
import { StatisticsStackParamList } from '../../navigation/MainNavigator';
import { getCategoryEmoji } from '../../utils/categoryIcons';

type Props = NativeStackScreenProps<StatisticsStackParamList, 'Statistics'>;

const CHART_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#94A3B8', // Slate
];

/**
 * StatisticsScreen - 통계 화면 (전면 리디자인)
 *
 * UI 참고 디자인을 바탕으로 앱의 정체성에 맞게 재구현한 통계 화면입니다.
 */
export const StatisticsScreen: React.FC<Props> = ({ navigation }) => {
  // State
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [statistics, setStatistics] = useState<MonthlyStatisticsResponseDto | null>(null);
  const [previousMonthStats, setPreviousMonthStats] = useState<MonthlyStatisticsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'category' | 'monthly'>('category');

  /**
   * 화면 진입 시 그룹 목록 로드
   */
  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * 그룹/연도/월 변경 시 통계 조회
   */
  useEffect(() => {
    if (selectedGroupId) {
      fetchStatistics();
    }
  }, [selectedGroupId, selectedYear, selectedMonth]);

  /**
   * 그룹 목록 조회
   */
  const fetchGroups = async () => {
    try {
      setError('');
      const groupsData = await groupApi.getMyGroups();
      setGroups(groupsData);

      // 첫 번째 그룹을 기본 선택
      if (groupsData.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsData[0].id);
      }
    } catch (err: any) {
      console.error('그룹 목록 조회 에러:', err);
      setError(err.message || '그룹 목록을 불러오는데 실패했습니다.');
    }
  };

  /**
   * 통계 조회 (현재 월 + 이전 월)
   */
  const fetchStatistics = async () => {
    if (!selectedGroupId) return;

    try {
      setError('');
      setLoading(true);

      // 현재 월과 이전 월 통계를 병렬로 조회
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      const [data, prevData] = await Promise.allSettled([
        statisticsApi.getMonthlyStatistics(
          selectedGroupId,
          selectedYear,
          selectedMonth
        ),
        statisticsApi.getMonthlyStatistics(
          selectedGroupId,
          prevYear,
          prevMonth
        ),
      ]);

      // 현재 월 통계 처리
      if (data.status === 'fulfilled') {
        setStatistics(data.value);
      } else {
        throw data.reason;
      }

      // 이전 월 통계 처리 (실패해도 무시)
      if (prevData.status === 'fulfilled') {
        setPreviousMonthStats(prevData.value);
      } else {
        console.log('이전 달 통계 조회 실패 (무시)');
        setPreviousMonthStats(null);
      }
    } catch (err: any) {
      console.error('통계 조회 에러:', err);
      setError(err.message || '통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    await fetchStatistics();
    setRefreshing(false);
  };

  /**
   * 이전 달로 이동
   */
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  /**
   * 다음 달로 이동
   */
  const goToNextMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // 미래 달로는 이동 불가
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return;
    }

    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  /**
   * 카테고리별 데이터 처리 (퍼센트 계산)
   */
  const getCategoryData = () => {
    if (!statistics || !statistics.categories || statistics.categories.length === 0) {
      return [];
    }

    const total = statistics.totalExpenseAmount;
    if (total === 0) return [];

    return statistics.categories
      .map((cat, index) => ({
        name: cat.tagName,
        amount: cat.totalAmount,
        percent: Math.round((cat.totalAmount / total) * 100),
        color: CHART_COLORS[index % CHART_COLORS.length],
        icon: getCategoryEmoji(cat.tagName),
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  /**
   * 월별 추이 데이터 처리
   */
  const getMonthlyTrendData = () => {
    if (!statistics || !statistics.yearlyStatistics || statistics.yearlyStatistics.length === 0) {
      return [];
    }

    const maxAmount = Math.max(...statistics.yearlyStatistics, 1);
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return statistics.yearlyStatistics.map((amount, index) => ({
      month: monthNames[index],
      amount,
      height: Math.max((amount / maxAmount) * 100, 5), // 최소 5%
      isCurrent: index === selectedMonth - 1,
    }));
  };

  /**
   * 지난달 대비 증감 계산
   */
  const getMonthlyComparison = () => {
    if (!statistics || !previousMonthStats) {
      return null;
    }

    const currentAmount = statistics.totalExpenseAmount;
    const previousAmount = previousMonthStats.totalExpenseAmount;

    if (previousAmount === 0) {
      return currentAmount > 0 ? { diff: currentAmount, isIncrease: true } : null;
    }

    const diff = currentAmount - previousAmount;
    const isIncrease = diff > 0;

    return { diff: Math.abs(diff), isIncrease };
  };

  /**
   * 로딩 화면
   */
  if (loading && !statistics) {
    return <LoadingSpinner fullScreen message="통계 데이터를 불러오는 중..." />;
  }

  /**
   * 에러 화면
   */
  if (error && !statistics) {
    return (
      <ErrorMessage
        message={error}
        fullScreen
        showRetry
        onRetry={fetchStatistics}
      />
    );
  }

  /**
   * 그룹이 없는 경우
   */
  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>통계</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons
            name="stats-chart-outline"
            size={64}
            color={COLORS.text.tertiary}
          />
          <Text style={styles.emptyTitle}>그룹이 없습니다</Text>
          <Text style={styles.emptySubtitle}>
            먼저 그룹을 생성하거나 참여해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryData = getCategoryData();
  const monthlyTrendData = getMonthlyTrendData();
  const comparison = getMonthlyComparison();
  const totalAmount = statistics?.totalExpenseAmount || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>통계</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 월 선택기 */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={goToPreviousMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {selectedYear}년 {selectedMonth}월
          </Text>

          <TouchableOpacity
            style={styles.monthButton}
            onPress={goToNextMonth}
            activeOpacity={0.7}
            disabled={
              selectedYear === new Date().getFullYear() &&
              selectedMonth === new Date().getMonth() + 1
            }
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                selectedYear === new Date().getFullYear() &&
                selectedMonth === new Date().getMonth() + 1
                  ? COLORS.text.tertiary
                  : COLORS.primary
              }
            />
          </TouchableOpacity>
        </View>

        {/* 총 지출 요약 카드 (다크 테마) */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryGradient} />
          <Text style={styles.summaryLabel}>이번 달 총 지출</Text>
          <View style={styles.summaryAmountRow}>
            <Text style={styles.summaryAmount}>
              {totalAmount.toLocaleString()}
            </Text>
            <Text style={styles.summaryUnit}>원</Text>
          </View>

          {/* 지난달 비교 */}
          {comparison && (
            <View
              style={[
                styles.comparisonBadge,
                comparison.isIncrease
                  ? styles.comparisonIncrease
                  : styles.comparisonDecrease,
              ]}
            >
              <Ionicons
                name={comparison.isIncrease ? 'trending-up' : 'trending-down'}
                size={14}
                color={COLORS.white}
              />
              <Text style={styles.comparisonText}>
                지난달보다{' '}
                <Text style={styles.comparisonAmount}>
                  {comparison.diff.toLocaleString()}원
                </Text>{' '}
                {comparison.isIncrease ? '더 썼어요' : '덜 썼어요'}
              </Text>
            </View>
          )}
        </Card>

        {/* 탭 스위처 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'category' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('category')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'category' && styles.tabTextActive,
              ]}
            >
              카테고리별
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'monthly' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('monthly')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'monthly' && styles.tabTextActive,
              ]}
            >
              월별 추이
            </Text>
          </TouchableOpacity>
        </View>

        {/* 카테고리별 탭 */}
        {activeTab === 'category' && (
          <View style={styles.tabContent}>
            {categoryData.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="document-outline"
                  size={48}
                  color={COLORS.text.tertiary}
                />
                <Text style={styles.emptyText}>
                  이번 달 지출 데이터가 없습니다
                </Text>
              </Card>
            ) : (
              <>
                {/* 카테고리 리스트 */}
                <View style={styles.categoryList}>
                  {categoryData.map((cat, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryInfo}>
                          <View style={styles.categoryIconContainer}>
                            <Text style={styles.categoryIcon}>{cat.icon}</Text>
                          </View>
                          <View style={styles.categoryTextContainer}>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <Text style={styles.categoryPercent}>
                              {cat.percent}%
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.categoryAmount}>
                          {cat.amount.toLocaleString()}원
                        </Text>
                      </View>

                      {/* 프로그레스 바 */}
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            { width: `${cat.percent}%`, backgroundColor: cat.color },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* 월별 추이 탭 */}
        {activeTab === 'monthly' && (
          <View style={styles.tabContent}>
            {monthlyTrendData.length === 0 ||
            monthlyTrendData.every((d) => d.amount === 0) ? (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="document-outline"
                  size={48}
                  color={COLORS.text.tertiary}
                />
                <Text style={styles.emptyText}>월별 통계 데이터가 없습니다</Text>
              </Card>
            ) : (
              <>
                {/* 막대 차트 */}
                <Card style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>
                      {selectedYear}년 월별 지출
                    </Text>
                    <View style={styles.chartBadge}>
                      <Text style={styles.chartBadgeText}>
                        총{' '}
                        {statistics?.yearlyStatistics
                          ?.reduce((a, b) => a + b, 0)
                          .toLocaleString()}
                        원
                      </Text>
                    </View>
                  </View>

                  <View style={styles.barChartContainer}>
                    {monthlyTrendData.map((data, index) => (
                      <View key={index} style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${data.height}%`,
                              backgroundColor: data.isCurrent
                                ? COLORS.primary
                                : COLORS.background.tertiary,
                            },
                          ]}
                        >
                          {data.isCurrent && <View style={styles.barIndicator} />}
                        </View>
                        <Text
                          style={[
                            styles.barLabel,
                            data.isCurrent && styles.barLabelActive,
                          ]}
                        >
                          {data.month}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>

                {/* 소비 분석 카드 */}
                {categoryData.length > 0 && (
                  <View style={styles.insightCard}>
                    <View style={styles.insightIconContainer}>
                      <Ionicons name="bulb" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>소비 분석</Text>
                      <Text style={styles.insightText}>
                        이번 달은{' '}
                        <Text style={styles.insightHighlight}>
                          {categoryData[0].name}
                        </Text>{' '}
                        지출이 가장 많아요. 전체의{' '}
                        <Text style={styles.insightHighlight}>
                          {categoryData[0].percent}%
                        </Text>
                        를 차지하고 있네요!
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* 미완료 정산 목록 */}
        {statistics &&
          statistics.incompletedSettlements &&
          statistics.incompletedSettlements.length > 0 && (
            <Card style={styles.settlementCard}>
              <View style={styles.settlementHeader}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={COLORS.warning}
                />
                <Text style={styles.settlementTitle}>
                  미완료 정산 {statistics.incompletedSettlements.length}건
                </Text>
              </View>

              {statistics.incompletedSettlements.map((settlement, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.settlementItem}
                  onPress={() =>
                    navigation.navigate('SettlementDetail', {
                      settlementId: settlement.settlementId,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.settlementItemTitle} numberOfLines={1}>
                    {settlement.title}
                  </Text>
                  <View style={styles.settlementItemRight}>
                    <Text style={styles.settlementItemAmount}>
                      {settlement.amount.toLocaleString()}원
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.text.tertiary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // 월 선택기
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // 총 지출 요약 카드
  summaryCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  summaryGradient: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.2,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 8,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
  },
  summaryUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 4,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  comparisonIncrease: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  comparisonDecrease: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  comparisonAmount: {
    fontWeight: '800',
  },

  // 탭 스위처
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.tertiary,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },

  // 탭 컨텐츠
  tabContent: {
    gap: 16,
  },

  // 카테고리 리스트
  categoryList: {
    gap: 20,
  },
  categoryItem: {
    gap: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.tertiary,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // 프로그레스 바
  progressBarContainer: {
    height: 10,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },

  // 차트 카드
  chartCard: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  chartBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    gap: 8,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
    minHeight: 8,
  },
  barIndicator: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.tertiary,
  },
  barLabelActive: {
    color: COLORS.primary,
  },

  // 인사이트 카드
  insightCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  insightHighlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },

  // 미완료 정산 카드
  settlementCard: {
    padding: 16,
    marginTop: 24,
  },
  settlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  settlementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  settlementItemTitle: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    marginRight: 12,
  },
  settlementItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settlementItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },

  // 빈 화면
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 12,
  },
});
