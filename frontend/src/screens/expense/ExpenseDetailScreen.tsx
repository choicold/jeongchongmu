import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ExpenseItemList } from '../../components/expense/ExpenseItemList';
import * as expenseApi from '../../services/api/expenseApi';
import * as voteApi from '../../services/api/voteApi';
import { ExpenseDetailDTO } from '../../types/expense.types';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { getCategoryEmoji } from '../../utils/categoryIcons';

type Props = NativeStackScreenProps<GroupsStackParamList, 'ExpenseDetail'>;

/**
 * ExpenseDetailScreen - 지출 상세 화면
 *
 * 지출의 상세 정보를 표시합니다.
 * 제목, 금액, 지불자, 날짜, 세부 항목, 참여자, 태그, 영수증 등을 확인할 수 있습니다.
 */
export const ExpenseDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { expenseId } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [expense, setExpense] = useState<ExpenseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [voteExists, setVoteExists] = useState(false);

  /**
   * 화면 진입 시 지출 상세 정보 로드
   */
  useEffect(() => {
    fetchExpenseDetail();
  }, [expenseId]);

  /**
   * 화면 포커스 시 지출 정보 새로고침
   * (정산 생성 후 돌아왔을 때 settlementId가 업데이트되도록)
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchExpenseDetail();
    });

    return unsubscribe;
  }, [navigation, expenseId]);

  /**
   * 지출 상세 정보 조회
   */
  const fetchExpenseDetail = async () => {
    try {
      setError('');
      setLoading(true);
      // API를 직접 호출하여 expense 데이터 가져오기
      const expenseData = await expenseApi.getExpenseDetail(expenseId);
      setExpense(expenseData);

      // 투표 존재 여부 확인
      try {
        await voteApi.getVoteStatus(expenseId);
        setVoteExists(true);
      } catch (voteErr: any) {
        // 투표가 없으면 404 에러가 발생함
        setVoteExists(false);
      }
    } catch (err: any) {
      console.error('지출 상세 조회 에러:', err);
      setError(err.message || '지출 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 정산 생성 화면으로 이동
   */
  const goToCreateSettlement = () => {
    navigation.navigate('CreateSettlement', { expenseId });
  };

  /**
   * 정산 상세 화면으로 이동
   */
  const goToSettlementDetail = () => {
    if (expense?.settlementId) {
      navigation.navigate('SettlementDetail', { settlementId: expense.settlementId });
    }
  };

  /**
   * 투표 화면으로 이동
   */
  const goToVote = () => {
    navigation.navigate('Vote', { expenseId, isEdit: false });
  };

  /**
   * 지출 수정 화면으로 이동
   */
  const goToEditExpense = () => {
    navigation.navigate('EditExpense', { expenseId });
  };

  /**
   * 지출 삭제
   */
  const handleDeleteExpense = () => {
    Alert.alert(
      '지출 삭제',
      '정말로 이 지출을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseApi.deleteExpense(expenseId);
              showToast('지출이 삭제되었습니다.', 'success');
              // Toast를 볼 수 있도록 약간의 딜레이 후 이동
              setTimeout(() => {
                navigation.goBack();
              }, 500);
            } catch (err: any) {
              showToast(err.message || '지출 삭제에 실패했습니다.', 'error');
            }
          },
        },
      ]
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="지출 정보를 불러오는 중..." />;
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
        onRetry={fetchExpenseDetail}
      />
    );
  }

  /**
   * 지출 정보가 없는 경우
   */
  if (!expense) {
    return (
      <ErrorMessage
        message="지출 정보를 찾을 수 없습니다."
        fullScreen
      />
    );
  }

  const categoryEmoji = getCategoryEmoji(expense.title);
  const perPersonAmount = expense.participants
    ? Math.floor(expense.amount / expense.participants.length)
    : expense.amount;

  return (
    <SafeAreaView style={styles.container}>
      {/* 깔끔한 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지출 상세</Text>
        <View style={styles.headerActions}>
          {user && expense && user.name === expense.payerName && (
            <>
              <TouchableOpacity
                onPress={goToEditExpense}
                style={styles.headerActionButton}
              >
                <Ionicons name="create-outline" size={22} color={COLORS.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteExpense}
                style={styles.headerActionButton}
              >
                <Ionicons name="trash-outline" size={22} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. 핵심 정보 카드 (금액, 타이틀) */}
        <Card style={styles.amountCard}>
          <View style={styles.categoryIconLarge}>
            <Text style={styles.categoryEmojiLarge}>{categoryEmoji}</Text>
          </View>
          <Text style={styles.amountTitle}>{expense.title}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{expense.amount.toLocaleString()}</Text>
            <Text style={styles.amountUnit}>원</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(expense.expenseData)}</Text>
        </Card>

        {/* 세부 정보 카드 (결제자, 카테고리) */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="person" size={20} color={COLORS.text.secondary} />
              </View>
              <Text style={styles.detailLabel}>결제자</Text>
              <Text style={styles.detailValue}>{expense.payerName}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="receipt" size={20} color={COLORS.text.secondary} />
              </View>
              <Text style={styles.detailLabel}>카테고리</Text>
              <Text style={styles.detailValue}>
                {expense.tagNames && expense.tagNames.length > 0
                  ? expense.tagNames[0]
                  : '기타'}
              </Text>
            </View>
          </View>
        </Card>

        {/* 참여 멤버 정보 */}
        {expense.participants && expense.participants.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.membersHeader}>
              <View style={styles.membersHeaderLeft}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>
                  함께한 멤버{' '}
                  <Text style={styles.memberCount}>
                    ({expense.participants.length}명)
                  </Text>
                </Text>
              </View>
              <View style={styles.perPersonBadge}>
                <Text style={styles.perPersonBadgeLabel}>1인당</Text>
                <Text style={styles.perPersonAmount}>
                  {perPersonAmount.toLocaleString()}원
                </Text>
              </View>
            </View>

            {/* 멤버 아바타 (겹쳐서 표시) */}
            <View style={styles.participantsAvatars}>
              {expense.participants.map((participant, index) => (
                <View
                  key={index}
                  style={[
                    styles.avatar,
                    { zIndex: expense.participants.length - index },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {participant.substring(0, 1)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 영수증 상세 (아코디언 UI) */}
        {expense.items && expense.items.length > 0 && (
          <Card style={styles.receiptCard}>
            <TouchableOpacity
              style={styles.receiptHeader}
              onPress={() => setIsReceiptOpen(!isReceiptOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.receiptHeaderLeft}>
                <View style={styles.receiptIcon}>
                  <Ionicons name="receipt" size={20} color={COLORS.text.primary} />
                </View>
                <Text style={styles.receiptTitle}>영수증 상세 내역</Text>
              </View>
              <Ionicons
                name={isReceiptOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.text.secondary}
              />
            </TouchableOpacity>

            {isReceiptOpen && (
              <View style={styles.receiptContent}>
                <View style={styles.receiptDivider} />
                {expense.items.map((item, index) => (
                  <View key={index} style={styles.receiptItem}>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <View style={styles.receiptItemDots} />
                    <Text style={styles.receiptItemPrice}>
                      {item.price.toLocaleString()}
                    </Text>
                  </View>
                ))}
                <View style={styles.receiptTotal}>
                  <Text style={styles.receiptTotalLabel}>합계</Text>
                  <Text style={styles.receiptTotalAmount}>
                    {expense.amount.toLocaleString()}원
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* 영수증 이미지 */}
        {expense.receiptUrl && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>영수증</Text>
            <Image
              source={{ uri: expense.receiptUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </Card>
        )}

        {/* 정산 버튼 */}
        <Card style={styles.section}>
          {expense.settlementId ? (
            <>
              <Button
                title="정산 확인하기"
                onPress={goToSettlementDetail}
                variant="secondary"
                style={styles.settlementButton}
              />
              <Text style={styles.settlementButtonHint}>
                이미 생성된 정산을 확인하거나 수정합니다
              </Text>
            </>
          ) : voteExists ? (
            <>
              <Button
                title="투표하기"
                onPress={goToVote}
                variant="secondary"
                style={styles.settlementButton}
              />
              <Text style={styles.settlementButtonHint}>
                항목별 투표에 참여하거나 수정합니다
              </Text>
            </>
          ) : (
            <>
              <Button
                title="정산 생성하기"
                onPress={goToCreateSettlement}
                variant="primary"
                style={styles.settlementButton}
              />
              <Text style={styles.settlementButtonHint}>
                이 지출에 대한 정산을 생성합니다
              </Text>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  // 깔끔한 헤더 (흰색)
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  // 스크롤 컨텐츠
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  // 1. 금액 카드 (깔끔한 중앙 정렬)
  amountCard: {
    marginBottom: 24,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryEmojiLarge: {
    fontSize: 30,
  },
  amountTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  amount: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: -1,
  },
  amountUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.tertiary,
    marginTop: 12,
    textAlign: 'center',
  },
  // 2. 세부 정보 카드 (결제자, 카테고리)
  detailsCard: {
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  // 3. 일반 섹션 (참여 멤버, 태그 등)
  section: {
    marginBottom: 24,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  // 멤버 헤더
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberCount: {
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  perPersonBadge: {
    backgroundColor: '#D1FAE5', // emerald-100
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perPersonBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669', // emerald-600
  },
  perPersonAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857', // emerald-700
  },
  // 멤버 아바타 (겹쳐서 표시)
  participantsAvatars: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5', // emerald-100
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669', // emerald-600
  },
  // 4. 영수증 아코디언 카드
  receiptCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC', // slate-50
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  receiptContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginBottom: 12,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptItemName: {
    fontSize: 14,
    color: '#64748B', // slate-500
    fontWeight: '500',
  },
  receiptItemDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', // slate-200
    borderStyle: 'dashed',
    marginHorizontal: 12,
    opacity: 0.5,
  },
  receiptItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155', // slate-700
  },
  receiptTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B', // slate-500
  },
  receiptTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669', // emerald-600
  },
  // 태그
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
  },
  settlementButton: {
    marginBottom: 8,
  },
  settlementButtonHint: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
