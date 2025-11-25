// src/screens/Statistics.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Dimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// [수정] 미정산 내역 아이템에서 ChevronRight 사용
import { ArrowLeft, ChevronDown, ChevronUp, BarChart3, PieChart, DollarSign, Lightbulb, AlertTriangle, Wallet, Zap, Bell, TrendingUp, ChevronRight } from 'lucide-react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
// [수정] LinearGradient 임포트 제거 (런타임 오류 방지)
// import LinearGradient from 'react-native-linear-gradient';

import { api } from '../api/client';
import { useAlert } from '../components/CustomAlert';

// --- Type Definitions (API 응답 구조) ---
interface CategoryData {
    tagName: string;
    totalAmount: number;
}

interface IncompletedSettlement {
    id: number;
    title: string;
    amount: number;
}

interface TopExpense {
    id: number;
    title: string;
    // title: string; // 중복 선언 방지
    amount: number;
}

interface StatisticData {
    totalExpenseAmount: number;
    totalExpenseCount: number;
    categories: CategoryData[];
    topExpense: TopExpense | null;
    totalSettlementCount: number;
    notCompletedSettlementCount: number;
    incompletedSettlements: IncompletedSettlement[];
    yearlyStatistics: number[]; // 12개월 (1월 ~ 12월) 지출 금액 배열
}

const initialStats: StatisticData = {
    totalExpenseAmount: 0,
    totalExpenseCount: 0,
    categories: [],
    topExpense: null,
    totalSettlementCount: 0,
    notCompletedSettlementCount: 0,
    incompletedSettlements: [],
    yearlyStatistics: Array(12).fill(0),
};

// 화면 너비 (차트 크기 계산용)
const { width: screenWidth } = Dimensions.get('window');
// 차트가 카드 내부에 잘 맞도록 너비를 설정합니다.
const CHART_WIDTH = screenWidth - 40 - 40; // 화면 너비 - (좌우 마진 20 * 2) - (카드 패딩 20 * 2)
const BAR_HEIGHT = 150;


// --- ⚠️ 안전한 스타일 정의를 위한 상수 분리 ⚠️ ---
// StyleSheet.create 밖에 정의되어 참조 오류를 일으키지 않습니다.
const BASE_CARD_STYLE: ViewStyle = {
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
};


// --- ⚠️ 스타일 정의를 최상단으로 이동하여 모든 컴포넌트에서 안전하게 참조하도록 수정 ⚠️ ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    // 헤더 스타일
    headerSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFF'
    },
    headerTitleSimple: { fontSize: 18, fontWeight: 'bold', marginLeft: 16, color: '#1F2937' },
    backButton: { paddingRight: 10 },

    // 카드 공통
    // [수정] cardContainer만 마진을 가지도록 통일하여 카드 넓이 문제를 해결
    cardContainer: { paddingHorizontal: 20, marginBottom: 12 }, // [수정] 카드 간 여백 감소 (20 -> 12)

    chartCard: {
        ...BASE_CARD_STYLE,
        // [수정] chartCard 자체의 하단 마진 제거 (외부 cardContainer의 marginBottom만 사용)
        padding: 20,
        marginBottom: 0,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    noDataText: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 20, fontSize: 14 },
    noDataTextSmall: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 10, fontSize: 13 },
    row: { flexDirection: 'row', alignItems: 'center' }, // 기본 row 스타일

    // --- TOP EXPENSE CARD (View 대체 및 레이아웃 개선) ---
    topExpenseCardView: {
        backgroundColor: '#7C3AED', // 짙은 보라색 단색 배경
        borderRadius: 16,
        padding: 24,
        justifyContent: 'space-between',
        shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 8 }, shadowRadius: 15, elevation: 10,
    },
    topExpenseContent: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingTop: 5, // [조정] 상단 여백 추가
    },
    topExpenseLabel: {
        fontSize: 12,
        color: '#DDAAFA',
        fontWeight: 'bold',
        marginLeft: 4,
        marginBottom: 2, // [조정]
    },
    topExpenseTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4, // [조정]
    },
    topExpenseValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10, // [조정]
    },
    topExpenseFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
    },
    topExpenseFooterText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 6,
    },
    topExpenseRow: { // TOP EXPENSE 레이블과 아이콘을 위한 정렬 전용 스타일
        flexDirection: 'row',
        alignItems: 'center',
        // [수정] 수직 중앙 정렬을 위해 필요하다면 추가 마진 조정
    },

    // --- 1. 요약 카드 (V3 - 이미지 기반 화이트 카드) ---
    summaryCardV3: {
        ...BASE_CARD_STYLE, // 흰색 배경, 그림자
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItemV3Left: {
        flex: 1,
        paddingRight: 10
    },
    summaryLabelV3: {
        fontSize: 15,
        color: '#6B7280', // 회색 텍스트
        fontWeight: '500',
        marginBottom: 8,
    },
    summaryValueV3Row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 4,
    },
    summaryValueV3: {
        fontSize: 30, // 이미지처럼 금액을 크게
        fontWeight: 'bold',
        color: '#1F2937',
    },
    summaryUnitV3: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 4,
        marginBottom: 3, // 금액과 높이 맞추기
    },
    summaryCountV3: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    summaryItemV3Right: {
        width: 50, height: 50,
        backgroundColor: '#EEF2FF', // 연한 보라색 배경
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 2. 인사이트 박스
    insightBox: { marginBottom: 16, marginTop: 16, padding: 12, borderRadius: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
    insightRed: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
    insightGreen: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#A7F3D0' },
    insightIcon: { padding: 4, borderRadius: 20, height: 28, width: 28, alignItems:'center', justifyContent:'center' },
    bgRed: { backgroundColor: '#FCD3D1' },
    bgGreen: { backgroundColor: '#BBF7D0' },
    insightText: { fontSize: 14, fontWeight: 'bold' },
    insightSub: { fontSize: 12, marginTop: 2 },

    // 3. 카테고리 목록
    categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    categoryName: { fontSize: 14, color: '#374151', fontWeight: '500' },
    categoryDetailRight: { flexDirection: 'row', alignItems: 'center', minWidth: 100, justifyContent: 'flex-end'},
    categoryAmount: { fontSize: 14, color: '#1F2937', fontWeight: 'bold', marginRight: 10 },
    categoryPercent: {
        fontSize: 12,
        color: '#6B7280',
        width: 35,
        textAlign: 'right'
    },

    // 4. 미정산 내역 (토글 디자인 V2 - 이미지 기반)
    settlementCard: {
        ...BASE_CARD_STYLE, // 안전하게 외부 상수 속성을 복사
        padding: 20,
        marginBottom: 0,
    },
    settlementSummaryRowV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
        marginBottom: 5,
    },
    settlementTitleV2: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginLeft: 8 },
    settlementBadge: {
        backgroundColor: '#FEEFDD', // 주황 계열 연한 배경
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    settlementBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#F59E0B', // 주황색
    },
    settlementList: { paddingTop: 5, borderTopWidth: 1, borderTopColor: '#F3F4F6' }, // 목록 위 경계선 추가
    settlementItemV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settlementTitleSmallV2: { fontSize: 16, color: '#1F2937', fontWeight: '600' },
    settlementSubText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    settlementDetailIcon: {
        padding: 5,
    },

    settlementFooterToggle: {
        paddingTop: 15,
        alignItems: 'center',
    },
    settlementFooterText: {
        fontSize: 13,
        color: '#4F46E5',
        fontWeight: 'bold',
    },
});


// --- [Component] 월별 바 차트 (최종 디자인 반영) ---
const MonthlyBarChart = ({ data, currentMonth }: { data: number[], currentMonth: number }) => {
    const maxAmount = Math.max(...data, 1);
    const chartInnerWidth = CHART_WIDTH;
    const totalBars = 12;
    const spacing = 10;
    const availableWidth = chartInnerWidth - spacing;
    const barWidth = (availableWidth / totalBars) - spacing;
    const backgroundBarColor = '#F3F4F6';
    const baseBarHeight = BAR_HEIGHT;

    return (
        <View style={{ paddingHorizontal: 0, marginTop: 20 }}>
            <Svg width={chartInnerWidth} height={baseBarHeight + 35}>
                {data.map((amount, index) => {
                    const barX = (index * (barWidth + spacing)) + (spacing / 2);
                    const barHeight = (amount / maxAmount) * baseBarHeight;
                    const actualBarY = baseBarHeight - barHeight;
                    const isCurrentMonth = index === currentMonth - 1;
                    const activeMonthColor = '#4F46E5';
                    const baseMonthColor = '#A5B4FC';
                    const monthColor = isCurrentMonth ? activeMonthColor : baseMonthColor;

                    return (
                        <G key={index}>
                            {/* 1. 배경 막대 (전체 높이, 연한 회색/보라색) */}
                            <Rect
                                x={barX}
                                y={0}
                                width={barWidth}
                                height={baseBarHeight}
                                fill={backgroundBarColor}
                                rx={4}
                            />

                            {/* 2. 데이터 막대 (실제 데이터 높이, 월별 색상) */}
                            {barHeight > 0 && (
                                <Rect
                                    x={barX}
                                    y={actualBarY}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={monthColor}
                                    rx={4}
                                />
                            )}

                            {/* Label (월) */}
                            <SvgText
                                x={barX + barWidth / 2}
                                y={baseBarHeight + 15}
                                fontSize="10"
                                fill={isCurrentMonth ? '#4F46E5' : '#6B7280'}
                                textAnchor="middle"
                                fontWeight={isCurrentMonth ? 'bold' : 'normal'}
                            >
                                {index + 1}
                            </SvgText>
                            <SvgText
                                x={barX + barWidth / 2}
                                y={baseBarHeight + 28}
                                fontSize="10"
                                fill={isCurrentMonth ? '#4F46E5' : '#6B7280'}
                                textAnchor="middle"
                            >
                                월
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

// --- [Component] 카테고리 목록 (파이 차트 스타일) ---
const CategoryList = ({ categories }: { categories: StatisticData['categories'] }) => {
    const total = categories.reduce((sum, c) => sum + c.totalAmount, 0);
    const sorted = [...categories].sort((a, b) => b.totalAmount - a.totalAmount);

    // 카테고리별 색상 배열
    const colors = useMemo(() => ['#4F46E5', '#34D399', '#FBBF24', '#F87171', '#9CA3AF', '#60A5FA', '#F472B6', '#67E8F9'], []);


    return (
        <View style={{ marginTop: 10 }}>
            {sorted.length === 0 ? (
                <Text style={styles.noDataTextSmall}>카테고리 데이터가 없습니다.</Text>
            ) : (
                sorted.map((cat, index) => {
                    const percentage = total > 0 ? (cat.totalAmount / total) * 100 : 0;
                    const color = colors[index % colors.length];

                    return (
                        <View key={cat.tagName} style={styles.categoryItem}>
                            <View style={styles.row}>
                                <View style={[styles.colorDot, { backgroundColor: color }]} />
                                <Text style={styles.categoryName}>{cat.tagName}</Text>
                            </View>
                            <View style={styles.categoryDetailRight}>
                                <Text style={styles.categoryAmount}>{cat.totalAmount.toLocaleString()}원</Text>
                                <Text style={styles.categoryPercent}>{percentage.toFixed(0)}%</Text>
                            </View>
                        </View>
                    );
                })
            )}
        </View>
    );
};

// --- [Component] 미정산 내역 토글 목록 ---
const SettlementToggleList = ({ notCompletedCount, incompletedSettlements }: { notCompletedCount: number, incompletedSettlements: IncompletedSettlement[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // 토글되지 않았을 때는 최대 3개 항목 표시, 토글되었을 때는 전체 표시
    const dataToShow = isExpanded ? incompletedSettlements : incompletedSettlements.slice(0, 3);
    const shouldShowToggle = incompletedSettlements.length > 3;

    return (
        <View style={styles.settlementCard}>
            <TouchableOpacity
                style={styles.settlementSummaryRowV2}
                onPress={() => notCompletedCount > 0 && setIsExpanded(prev => !prev)}
                activeOpacity={0.8}
            >
                <View style={styles.row}>
                    <DollarSign size={20} color="#F59E0B" />
                    <Text style={styles.settlementTitleV2}>미정산 내역</Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.settlementBadge}>
                        <Text style={styles.settlementBadgeText}>{notCompletedCount}건</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* 미정산 목록 (토글 기능 적용) */}
            {notCompletedCount > 0 ? (
                <View style={styles.settlementList}>
                    {dataToShow.map((item, index) => (
                        <TouchableOpacity key={item.id || index} style={styles.settlementItemV2} activeOpacity={0.7}>
                            <View>
                                <Text style={styles.settlementTitleSmallV2} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.settlementSubText}>{item.amount.toLocaleString()}원, 정산이 필요해요</Text>
                            </View>
                            <View style={styles.settlementDetailIcon}>
                                <ChevronRight size={20} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* 푸터 토글 버튼 */}
                    {shouldShowToggle && (
                        <TouchableOpacity
                            onPress={() => setIsExpanded(prev => !prev)}
                            style={styles.settlementFooterToggle}
                        >
                            <Text style={styles.settlementFooterText}>
                                {isExpanded
                                    ? '목록 숨기기'
                                    : `${incompletedSettlements.length - dataToShow.length}개 항목 더 보기`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <Text style={styles.noDataTextSmall}>현재 정산할 내역이 없습니다. 🎉</Text>
            )}
        </View>
    );
};


// --- [Screen] 그룹 통계 분석 화면 ---
interface StatisticsScreenProps {
    group: { id: number; name: string; }; // 그룹 정보 (id와 name만 필요)
    date: Date; // GroupDetailScreen에서 전달받은 현재 월 정보
    onBack: () => void;
    token: string | null;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ group, date: initialDate, onBack, token }) => {
    const [currentDate] = useState(initialDate ? new Date(initialDate) : new Date());
    const [stats, setStats] = useState<StatisticData>(initialStats);
    // [수정] const [loading, setLoading] = true; -> useState(true)로 수정
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const [errorCount, setErrorCount] = useState(0);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1부터 시작

    // --- 통계 API 호출 함수 ---
    const fetchStatistics = useCallback(async () => {
        if (!token || !group.id || errorCount > 1) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data: StatisticData = await api.getStatistics(token, group.id, year, month);

            if (data && typeof data.totalExpenseAmount === 'number' && Array.isArray(data.yearlyStatistics)) {
                setStats(data);
                setErrorCount(0);
            } else {
                throw new Error("서버 응답 형식이 올바르지 않습니다.");
            }
        } catch (error: any) {
            console.error("통계 로드 실패:", error);
            setStats(initialStats);
            setErrorCount(c => c + 1);

            showAlert({
                title: "통계 로드 오류",
                message: error.message || "통계 데이터를 불러오지 못했습니다.",
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [token, group.id, year, month, showAlert, errorCount]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const { totalExpenseAmount, totalExpenseCount, categories, notCompletedSettlementCount, incompletedSettlements, topExpense } = stats;

    const yearlyTotal = stats.yearlyStatistics.reduce((a, b) => a + b, 0);
    const activeMonthsCount = stats.yearlyStatistics.filter(amt => amt > 0).length || 1;
    const averageAmount = Math.floor(yearlyTotal / activeMonthsCount);
    const diffAmount = totalExpenseAmount - averageAmount;

    let insightMessage = "월평균과 비슷해요";
    let isSpendingMore = false;
    if (diffAmount > 1000) {
        insightMessage = `월평균보다 ${diffAmount.toLocaleString()}원 더 썼어요 💸`;
        isSpendingMore = true;
    } else if (diffAmount < -1000) {
        insightMessage = `월평균보다 ${Math.abs(diffAmount).toLocaleString()}원 절약했어요 👏`;
        isSpendingMore = false;
    } else {
        insightMessage = "월평균 지출과 비슷한 수준이에요.";
    }


    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            {/* 헤더 */}
            <View style={[styles.headerSimple, { paddingTop: insets.top + 10, paddingBottom: 10 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}><ArrowLeft color="#1F2937" size={24} /></TouchableOpacity>
                <Text style={styles.headerTitleSimple}>{group.name} {month}월 분석</Text>
            </View>

            {/* [수정] 헤더와 스크롤뷰 사이에 여백 추가 (paddingTop: 10) */}
            <ScrollView contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}>
                {loading ? (
                    <ActivityIndicator color="#4F46E5" size="large" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* 1. 총 지출 금액 및 건수 요약 (V3 - 이미지 기반 화이트 카드) */}
                        <View style={styles.cardContainer}>
                            <View style={styles.summaryCardV3}>
                                <View style={styles.summaryItemV3Left}>
                                    <Text style={styles.summaryLabelV3}>{month}월 총 지출</Text>
                                    <View style={styles.summaryValueV3Row}>
                                        <Text style={styles.summaryValueV3}>{totalExpenseAmount.toLocaleString()}</Text>
                                        <Text style={styles.summaryUnitV3}>원</Text>
                                    </View>
                                    <Text style={styles.summaryCountV3}>총 {totalExpenseCount}건의 지출</Text>
                                </View>
                                <View style={styles.summaryItemV3Right}>
                                    <TrendingUp size={24} color="#4F46E5" />
                                </View>
                            </View>
                        </View>

                        {/* 2. 카테고리별 지출 분석 */}
                        <View style={styles.cardContainer}>
                            <View style={styles.chartCard}>
                                <View style={styles.cardTitleRow}>
                                    <PieChart size={20} color="#4F46E5" />
                                    <Text style={styles.cardTitle}>카테고리별 지출 분석</Text>
                                </View>
                                <CategoryList categories={categories} />
                            </View>
                        </View>

                        {/* 3. 가장 큰 지출 항목 (TOP EXPENSE) */}
                        {topExpense && (
                            <View style={styles.cardContainer}>
                                {/* [수정] LinearGradient 대신 View 사용 */}
                                <View
                                    style={styles.topExpenseCardView}
                                >
                                    <View style={styles.topExpenseContent}>
                                        <View style={styles.row}>
                                            <Zap size={16} color="#FFF" />
                                            <Text style={styles.topExpenseLabel}>TOP EXPENSE</Text>
                                        </View>
                                        <Text style={styles.topExpenseTitle}>{topExpense.title}</Text>
                                        <Text style={styles.topExpenseValue}>{topExpense.amount.toLocaleString()}원</Text>
                                    </View>
                                    <View style={styles.topExpenseFooter}>
                                        <AlertTriangle size={14} color="#FFF" />
                                        <Text style={styles.topExpenseFooterText}>이번 달 가장 큰 지출이에요!</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* 4. 미정산 내역 (토글 컴포넌트 사용) */}
                        <View style={styles.cardContainer}>
                            <SettlementToggleList
                                notCompletedCount={notCompletedSettlementCount}
                                incompletedSettlements={incompletedSettlements}
                            />
                        </View>

                        {/* 5. 연간 지출 추이 (맨 아래 배치) */}
                        <View style={styles.cardContainer}>
                            <View style={styles.chartCard}>
                                <View style={styles.cardTitleRow}>
                                    <BarChart3 size={20} color="#4F46E5" />
                                    <Text style={styles.cardTitle}>연간 지출 추이 ({year}년)</Text>
                                </View>

                                {/* 평균 비교 코멘트 */}
                                <View style={[styles.insightBox, isSpendingMore ? styles.insightRed : styles.insightGreen]}>
                                    <View style={[styles.insightIcon, isSpendingMore ? styles.bgRed : styles.bgGreen]}>
                                        {isSpendingMore ? <AlertTriangle size={16} color="#DC2626" /> : <Lightbulb size={16} color="#16A34A" />}
                                    </View>
                                    <View>
                                        <Text style={[styles.insightText, {color: isSpendingMore ? '#DC2626' : '#16A34A'}]}>{insightMessage}</Text>
                                        <Text style={[styles.insightSub, {color: isSpendingMore ? '#EF4444' : '#10B981'}]}>월평균: {averageAmount.toLocaleString()}원</Text>
                                    </View>
                                </View>

                                <MonthlyBarChart data={stats.yearlyStatistics} currentMonth={month} />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};