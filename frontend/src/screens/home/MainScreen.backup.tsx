import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as groupApi from '../../services/api/groupApi';
import * as expenseApi from '../../services/api/expenseApi';
import * as settlementApi from '../../services/api/settlementApi';
import { GroupDto } from '../../types/group.types';
import { ExpenseSimpleDTO } from '../../types/expense.types';
import { formatRelativeTime } from '../../utils/dateFormatter';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { MainStackParamList, MainTabParamList } from '../../navigation/MainNavigator';
import { getCategoryEmoji } from '../../utils/categoryIcons';

type Props = CompositeScreenProps<
  NativeStackScreenProps<MainStackParamList, 'Main'>,
  BottomTabScreenProps<MainTabParamList>
>;

interface ActivityItem {
  id: number;
  title: string;
  time: string;
  amount: string;
  user: string;
  type: 'expense';
  icon: string;
  groupId: number;
  expenseId: number;
}

interface ExpenseWithGroup extends ExpenseSimpleDTO {
  groupId: number;
}

/**
 * MainScreen - 메인 대시보드 화면
 *
 * 사용자의 그룹 요약, 최근 활동, 정산 현황을 한눈에 보여줍니다.
 */
export const MainScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotification();

  // State
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // 실제 데이터
  const [totalExpense, setTotalExpense] = useState(0);
  const [toReceive, setToReceive] = useState(0);
  const [toSend, setToSend] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  /**
   * 화면 진입 시 데이터 로드
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * 화면 포커스 시 데이터 새로고침
   * (그룹/지출 생성/삭제 후 메인화면이 자동으로 갱신됨)
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * 데이터 조회
   */
  const fetchData = async () => {
    try {
      setError('');

      // 그룹 목록 조회
      const groupsData = await groupApi.getMyGroups();
      setGroups(groupsData.slice(0, 5)); // 최대 5개만 표시

      // 모든 그룹의 지출 조회
      const allExpenses: ExpenseWithGroup[] = [];
      const allSettlements = new Map<number, any>(); // expenseId -> settlement

      for (const group of groupsData) {
        try {
          const groupExpenses = await expenseApi.getExpensesByGroup(group.id);
          const expensesWithGroup = groupExpenses.map(expense => ({
            ...expense,
            groupId: group.id,
          }));
          allExpenses.push(...expensesWithGroup);

          // 각 지출에 대한 정산 정보 조회
          for (const expense of groupExpenses) {
            if (expense.settlementId) {
              try {
                const settlement = await settlementApi.getSettlement(expense.settlementId);
                allSettlements.set(expense.id, settlement);
              } catch (err) {
                console.error(`정산 ${expense.settlementId} 조회 실패:`, err);
              }
            }
          }
        } catch (err) {
          console.error(`그룹 ${group.id} 지출 조회 실패:`, err);
        }
      }

      // 이번 달 총 지출 계산 (그룹별 합산)
      // 로직:
      // 1. 내가 결제자인 경우 - 정산 있으면 내 채무만, 정산 없으면 전체 금액
      // 2. 내가 참여자인 경우 - 정산 있으면 내 채무만, 정산 없으면 제외
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      let totalMonthExpense = 0;

      // 그룹별로 순회하며 이번 달 지출 계산
      for (const group of groupsData) {
        try {
          const groupExpenses = await expenseApi.getExpensesByGroup(group.id);

          // 이번 달 지출만 필터링
          const thisMonthGroupExpenses = groupExpenses.filter((expense) => {
            const expenseDate = new Date(expense.expenseData);
            return (
              expenseDate.getFullYear() === thisYear &&
              expenseDate.getMonth() === thisMonth
            );
          });

          // 그룹별 지출 계산
          const groupTotal = thisMonthGroupExpenses.reduce((sum, expense) => {
            if (!user) return sum;

            const isPayer = expense.payerName === user.name;
            const isParticipant = expense.participants?.includes(user.name) ?? false;

            // 내가 포함되지 않은 지출은 제외
            if (!isPayer && !isParticipant) {
              return sum;
            }

            const settlement = allSettlements.get(expense.id);

            // 정산이 있는 경우: 정산 세부 내역에서 내가 채무자인 금액 합산
            if (settlement && settlement.details) {
              const myDebt = settlement.details
                .filter((detail: any) => detail.debtorName === user.name)
                .reduce((total: number, detail: any) => total + detail.amount, 0);
              return sum + myDebt;
            }

            // 정산이 없는 경우: 결제자만 전체 금액 포함
            if (isPayer) {
              return sum + expense.amount;
            }

            return sum;
          }, 0);

          totalMonthExpense += groupTotal;
        } catch (err) {
          console.error(`그룹 ${group.id} 이번 달 지출 계산 실패:`, err);
        }
      }

      setTotalExpense(totalMonthExpense);

      // 최근 활동 생성 (최근 5개)
      const sortedExpenses = [...allExpenses].sort((a, b) => {
        return (
          new Date(b.expenseData).getTime() - new Date(a.expenseData).getTime()
        );
      });
      const recentExpenses = sortedExpenses.slice(0, 5);
      const activities: ActivityItem[] = recentExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        time: formatRelativeTime(expense.expenseData),
        amount: `${expense.amount.toLocaleString()}원`,
        user: expense.payerName,
        type: 'expense' as const,
        icon: getCategoryEmoji(expense.title),
        groupId: expense.groupId,
        expenseId: expense.id,
      }));
      setRecentActivities(activities);

      // 정산 현황 조회
      try {
        const { toReceive: receive, toSend: send } = await settlementApi.getMySettlementSummary();
        setToReceive(receive);
        setToSend(send);
      } catch (err) {
        console.error('정산 현황 조회 실패:', err);
        // 실패해도 다른 데이터는 표시
        setToReceive(0);
        setToSend(0);
      }
    } catch (err: any) {
      console.error('데이터 조회 에러:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh 핸들러
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /**
   * 그룹 생성 화면으로 이동
   */
  const goToCreateGroup = () => {
    // GroupsTab으로 전환 후 CreateGroup 화면으로 이동
    navigation.getParent()?.navigate('GroupsTab', {
      screen: ROUTES.GROUPS.CREATE_GROUP,
    });
  };

  /**
   * 그룹 목록 전체보기
   */
  const goToGroupList = () => {
    // GroupsTab으로 전환하고 스택을 GroupList로 리셋
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('GroupsTab', {
        screen: ROUTES.GROUPS.GROUP_LIST,
      });
    }
  };

  /**
   * 그룹 상세 화면으로 이동
   */
  const goToGroupDetail = (groupId: number) => {
    // MainTab 내에서 GroupDetail로 직접 이동 (뒤로가기 시 메인화면으로 복귀)
    navigation.navigate('GroupDetail', { groupId });
  };

  /**
   * 알림 화면으로 이동
   */
  const goToNotifications = () => {
    navigation.navigate('NotificationsTab');
  };

  /**
   * 지출 상세 화면으로 이동
   */
  const goToExpenseDetail = (groupId: number, expenseId: number) => {
    // MainTab 내에서 ExpenseDetail로 직접 이동 (뒤로가기 시 메인화면으로 복귀)
    navigation.navigate('ExpenseDetail', { expenseId });
  };

  /**
   * 그룹 카드 렌더링 (가로 스크롤)
   */
  const renderGroupCard = ({ item }: { item: GroupDto }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => goToGroupDetail(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.groupCardBackground} />
      <View style={styles.groupCardIconContainer}>
        {item.icon ? (
          <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
        ) : (
          <Ionicons name="people" size={24} color={COLORS.primary} />
        )}
      </View>
      <View style={styles.groupCardContent}>
        <Text style={styles.groupCardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.groupCardMembers}>멤버 {item.memberCount}명</Text>
      </View>
      <View style={styles.groupCardProgress}>
        <View style={styles.groupCardProgressBar} />
      </View>
    </TouchableOpacity>
  );

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="데이터를 불러오는 중..." />;
  }

  /**
   * 에러 화면
   */
  if (error) {
    return (
      <ErrorMessage
        message={error}
        fullScreen
        showRetry
        onRetry={fetchData}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
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
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={20} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.headerGreeting}>안녕하세요,</Text>
                <Text style={styles.headerName}>{user?.name || '사용자'}님</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={goToNotifications}
              >
                <Ionicons name="notifications" size={20} color={COLORS.white} />
                {unreadCount > 0 && <View style={styles.notificationBadge} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* 정산 요약 */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>이번 달 총 지출</Text>
            <Text style={styles.summaryAmount}>{totalExpense.toLocaleString()}원</Text>
          </View>
        </View>

        {/* 플로팅 카드 (받을 돈 / 보낼 돈) */}
        <View style={styles.floatingCard}>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>받을 돈</Text>
              <Text style={styles.balanceReceive}>+ {toReceive.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>보낼 돈</Text>
              <Text style={styles.balanceSend}>- {toSend.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* 내 모임 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 모임</Text>
            <TouchableOpacity onPress={goToGroupList} style={styles.sectionButton}>
              <Text style={styles.sectionButtonText}>전체보기</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* 가로 스크롤 그룹 리스트 */}
          {groups.length > 0 ? (
            <FlatList
              data={groups}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderGroupCard}
              contentContainerStyle={styles.groupList}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addGroupButton}
                  onPress={goToCreateGroup}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              }
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyTitle}>아직 그룹이 없습니다</Text>
              <Text style={styles.emptySubtitle}>새 그룹을 만들어보세요!</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={goToCreateGroup}
              >
                <Text style={styles.emptyButtonText}>그룹 만들기</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* 최근 활동 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          <Card style={styles.activityCard}>
            {recentActivities.length > 0 ? (
              recentActivities.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.activityItem}
                    activeOpacity={0.7}
                    onPress={() => goToExpenseDetail(item.groupId, item.expenseId)}
                  >
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityIcon}>{item.icon}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activityUser}>
                        {item.user} • {item.time}
                      </Text>
                    </View>
                    <Text style={styles.activityAmount}>
                      {item.amount}
                    </Text>
                  </TouchableOpacity>
                  {index < recentActivities.length - 1 && (
                    <View style={styles.activityDivider} />
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons name="time-outline" size={32} color={COLORS.text.tertiary} />
                <Text style={styles.emptyActivityText}>최근 활동이 없습니다</Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 80,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerGreeting: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  floatingCard: {
    marginHorizontal: 24,
    marginTop: -56,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border.light,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  balanceReceive: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  balanceSend: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 2,
  },
  groupList: {
    paddingRight: 24,
  },
  groupCard: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  groupCardBackground: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 64,
    height: 64,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 32,
    opacity: 0.5,
  },
  groupCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  groupCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  groupCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  groupCardMembers: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  groupCardProgress: {
    marginTop: 8,
    height: 4,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  groupCardProgressBar: {
    width: '50%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  addGroupButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    alignSelf: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  activityCard: {
    padding: 4,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  activityUser: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  activityAmountIncome: {
    color: COLORS.primary,
  },
  activityAmountCompleted: {
    color: COLORS.text.tertiary,
    textDecorationLine: 'line-through',
  },
  activityDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginHorizontal: 12,
  },
});
