import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { ExpenseCard } from '../../components/expense/ExpenseCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as expenseApi from '../../services/api/expenseApi';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { ExpenseSimpleDTO } from '../../types/expense.types';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = NativeStackScreenProps<GroupsStackParamList, 'ExpenseList'>;

/**
 * ExpenseListScreen - 지출 목록 화면
 *
 * 특정 그룹의 지출 내역을 리스트로 표시합니다.
 * 우측 하단 FAB 버튼으로 지출을 등록할 수 있습니다.
 */
export const ExpenseListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { showAlert } = useCustomAlert();

  // State
  const [expenses, setExpenses] = useState<ExpenseSimpleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  /**
   * 화면 진입 시 지출 목록 로드
   */
  useEffect(() => {
    fetchExpenses();
  }, [groupId]);

  /**
   * 지출 목록 조회
   */
  const fetchExpenses = async () => {
    try {
      setError('');
      const data = await expenseApi.getExpensesByGroup(groupId);
      setExpenses(data);
    } catch (err: any) {
      console.error('지출 목록 조회 에러:', err);
      setError(err.message || '지출 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh 핸들러
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  /**
   * 지출 상세 화면으로 이동
   */
  const goToExpenseDetail = (expenseId: number) => {
    navigation.navigate(ROUTES.EXPENSES.EXPENSE_DETAIL, { expenseId });
  };

  /**
   * FAB 버튼 클릭 - 지출 등록 옵션 표시
   */
  const handleFABPress = () => {
    if (Platform.OS === 'ios') {
      // iOS - ActionSheet 사용
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '수동 입력', '영수증 스캔'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            goToCreateExpense();
          } else if (buttonIndex === 2) {
            goToOCRScan();
          }
        }
      );
    } else {
      // Android - showAlert 사용
      showAlert({
        title: '지출 등록',
        message: '지출을 어떻게 등록하시겠어요?',
        buttons: [
          {
            text: '수동 입력',
            onPress: goToCreateExpense,
          },
          {
            text: '영수증 스캔',
            onPress: goToOCRScan,
          },
          {
            text: '취소',
            style: 'cancel',
          },
        ],
      });
    }
  };

  /**
   * 수동 입력 화면으로 이동
   */
  const goToCreateExpense = () => {
    navigation.navigate(ROUTES.EXPENSES.CREATE_EXPENSE, { groupId });
  };

  /**
   * OCR 스캔 화면으로 이동
   */
  const goToOCRScan = () => {
    navigation.navigate(ROUTES.EXPENSES.OCR_SCAN, { groupId });
  };

  /**
   * 지출 카드 렌더링
   */
  const renderExpenseItem = ({ item }: { item: ExpenseSimpleDTO }) => {
    return (
      <ExpenseCard
        expense={item}
        onPress={() => goToExpenseDetail(item.id)}
      />
    );
  };

  /**
   * 빈 목록 렌더링
   */
  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={COLORS.text.tertiary}
          />
        </View>
        <Text style={styles.emptyTitle}>아직 지출 내역이 없습니다</Text>
        <Text style={styles.emptySubtitle}>
          우측 하단의 + 버튼을 눌러{'\n'}
          지출을 등록해보세요!
        </Text>
      </View>
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="지출 목록을 불러오는 중..." />;
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
        onRetry={fetchExpenses}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 96, // FAB 공간 확보
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
