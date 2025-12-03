import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SettlementMethodSelector } from '../../components/settlement/SettlementMethodSelector';
import { SettlementInputForm } from '../../components/settlement/SettlementInputForm';
import * as expenseApi from '../../services/api/expenseApi';
import * as groupMemberApi from '../../services/api/groupMemberApi';
import * as settlementApi from '../../services/api/settlementApi';
import * as voteApi from '../../services/api/voteApi';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { ExpenseDetailDTO } from '../../types/expense.types';
import { GroupMemberDto } from '../../types/group.types';
import {
  SettlementMethod,
  DirectSettlementEntry,
  PercentSettlementEntry,
} from '../../types/settlement.types';
import { COLORS } from '../../constants/colors';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateSettlement'>;

/**
 * CreateSettlementScreen - 정산 생성 화면
 *
 * 전체 구현: 정산 방식 선택 및 각 방식별 입력 UI
 */
export const CreateSettlementScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { expenseId } = route.params;
  const { user } = useAuth();
  const { invalidateSettlement, invalidateExpense } = useData();
  const { showToast } = useToast();
  const { showAlert } = useCustomAlert();

  // === 1단계: 기본 State ===
  const [expense, setExpense] = useState<ExpenseDetailDTO | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [method, setMethod] = useState<SettlementMethod>('N_BUN_1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // === 2단계: 입력 State (TODO) ===
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [directEntries, setDirectEntries] = useState<DirectSettlementEntry[]>(
    []
  );
  const [percentEntries, setPercentEntries] = useState<
    PercentSettlementEntry[]
  >([]);

  /**
   * 화면 진입 시 지출 정보 및 그룹 멤버 로드
   */
  useEffect(() => {
    fetchData();
  }, [expenseId]);

  /**
   * 지출 정보 및 그룹 멤버 조회
   */
  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      // 1. 지출 정보 조회
      const expenseData = await expenseApi.getExpenseDetail(expenseId);

      // 2. 접근 권한 확인: 현재 사용자가 지출 참여자인지 확인
      if (user && expenseData.participants && expenseData.participants.length > 0) {
        const isParticipant = expenseData.participants.includes(user.name);
        if (!isParticipant) {
          setError('이 지출의 참여자만 정산을 생성할 수 있습니다.');
          return;
        }
      }

      setExpense(expenseData);

      // 3. 그룹 멤버 조회
      const membersData = await groupMemberApi.getGroupMembers(
        expenseData.groupId
      );

      // 4. 지출에 포함된 멤버만 필터링 (정산 참여자는 지출 참여자와 동일)
      const filteredMembers = expenseData.participants && expenseData.participants.length > 0
        ? membersData.filter(member =>
            expenseData.participants.includes(member.user.name)
          )
        : membersData; // participants가 없으면 전체 멤버 표시

      setMembers(filteredMembers);

      // 5. 지출 참여자를 participantIds로 자동 설정 (멤버 고정)
      const participantUserIds = filteredMembers.map(member => member.user.id);
      setParticipantIds(participantUserIds);

      // 6. 직접/퍼센트 정산을 위한 초기 엔트리 생성
      const initialDirectEntries = filteredMembers.map(member => ({
        userId: member.user.id,
        amount: 0,
      }));
      setDirectEntries(initialDirectEntries);

      const initialPercentEntries = filteredMembers.map(member => ({
        userId: member.user.id,
        ratio: 0,
      }));
      setPercentEntries(initialPercentEntries);
    } catch (err: any) {
      console.error('데이터 조회 에러:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 정산 방식 변경 핸들러
   */
  const handleMethodChange = (newMethod: SettlementMethod) => {
    // 항목별 정산 선택 시 세부 항목 검증
    if (newMethod === 'ITEM' && expense) {
      if (!expense.items || expense.items.length === 0) {
        showAlert({
          title: '항목별 정산 불가',
          message: '항목별 정산은 세부 항목이 있는 지출만 가능합니다.',
        });
        return;
      }
    }

    setMethod(newMethod);

    // 항목별 정산이 아닐 경우 입력값 초기화 방지 (멤버 고정 유지)
    if (newMethod !== 'ITEM') {
      // participantIds는 유지 (이미 fetchData에서 설정됨)
      // directEntries와 percentEntries는 이미 초기화되어 있음
    }
  };

  /**
   * 정산 생성 처리
   */
  const handleCreateSettlement = async () => {
    if (!expense) return;

    // 입력값 검증
    const validationError = validateInputs();
    if (validationError) {
      showAlert({
        title: '입력 오류',
        message: validationError,
      });
      return;
    }

    // 항목별 정산은 투표 생성
    if (method === 'ITEM') {
      await createVoteForItemSettlement();
      return;
    }

    // 일반 정산 생성
    await createSettlement();
  };

  /**
   * 입력값 검증
   */
  const validateInputs = (): string | null => {
    switch (method) {
      case 'N_BUN_1':
        if (participantIds.length === 0) {
          return '참여자를 최소 1명 이상 선택해주세요.';
        }
        break;

      case 'DIRECT':
        if (directEntries.length === 0) {
          return '각 참여자별 금액을 입력해주세요.';
        }
        const directTotal = directEntries.reduce((sum, e) => sum + e.amount, 0);
        if (expense && directTotal !== expense.amount) {
          return `입력 금액 합계(${directTotal.toLocaleString()}원)가 총 금액(${expense.amount.toLocaleString()}원)과 일치하지 않습니다.`;
        }
        break;

      case 'PERCENT':
        if (percentEntries.length === 0) {
          return '각 참여자별 비율을 입력해주세요.';
        }
        const percentTotal = percentEntries.reduce((sum, e) => sum + e.ratio, 0);
        if (Math.abs(percentTotal - 100) > 0.1) {
          return `비율 합계(${percentTotal.toFixed(1)}%)가 100%가 되어야 합니다.`;
        }
        break;

      case 'ITEM':
        // 항목별 정산은 별도 검증 없음
        break;
    }

    return null;
  };

  /**
   * 정산 생성 API 호출
   */
  const createSettlement = async () => {
    if (!expense) return;

    try {
      setLoading(true);

      const requestData: any = {
        expenseId,
        method,
        participantUserIds:
          method === 'N_BUN_1'
            ? participantIds
            : method === 'DIRECT'
            ? directEntries.map((e) => e.userId)
            : percentEntries.map((e) => e.userId),
      };

      // 각 방식별로 필요한 필드만 추가
      if (method === 'DIRECT') {
        requestData.directEntries = directEntries;
      } else if (method === 'PERCENT') {
        requestData.percentEntries = percentEntries;
      }

      const settlement = await settlementApi.createSettlement(requestData);

      // 데이터 컨텍스트 갱신 (반응형 업데이트)
      invalidateSettlement(expenseId);
      invalidateExpense(expenseId);

      showAlert({
        title: '성공',
        message: '정산이 생성되었습니다.',
        buttons: [
          {
            text: '확인',
            onPress: () => {
              navigation.replace('SettlementDetail', {
                settlementId: settlement.settlementId,
              });
            },
          },
        ],
      });
    } catch (error: any) {
      console.error('정산 생성 에러:', error);

      // 중복 정산 에러인 경우 기존 정산 조회 옵션 제공
      if (error.message?.includes('이미 정산이 생성된')) {
        showAlert({
          title: '정산 중복',
          message: '이미 정산이 생성된 지출입니다. 기존 정산을 확인하시겠습니까?',
          buttons: [
            {
              text: '취소',
              style: 'cancel',
            },
            {
              text: '기존 정산 보기',
              onPress: async () => {
                try {
                  // expenseId로 settlement 조회 시도
                  const settlement = await settlementApi.getSettlementByExpenseId(expenseId);
                  if (settlement) {
                    navigation.replace('SettlementDetail', {
                      settlementId: settlement.settlementId,
                    });
                  } else {
                    navigation.goBack();
                  }
                } catch {
                  navigation.goBack();
                }
              },
            },
          ],
        });
      } else {
        showAlert({
          title: '오류',
          message: error.message || '정산 생성에 실패했습니다.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 항목별 정산 투표 생성
   */
  const createVoteForItemSettlement = async () => {
    try {
      setLoading(true);

      const vote = await voteApi.createVote(expenseId);

      showToast('항목별 정산을 위한 투표가 생성되었습니다.', 'success');

      navigation.replace('Vote', {
        expenseId,
      });
    } catch (error: any) {
      console.error('투표 생성 에러:', error);
      showToast(error.message || '투표 생성에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
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
        onRetry={fetchData}
      />
    );
  }

  /**
   * 지출 정보가 없는 경우
   */
  if (!expense) {
    return (
      <ErrorMessage message="지출 정보를 찾을 수 없습니다." fullScreen />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerContainerTitle}>정산 생성</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 서브 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            정산 방식을 선택하고 참여자를 지정하세요
          </Text>
        </View>

        {/* 지출 정보 요약 */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>지출 정보</Text>
          <View style={styles.expenseInfo}>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>제목</Text>
              <Text style={styles.expenseValue}>{expense.title}</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>총 금액</Text>
              <Text style={[styles.expenseValue, styles.amountText]}>
                {expense.amount.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>지불자</Text>
              <Text style={styles.expenseValue}>{expense.payerName}</Text>
            </View>
          </View>
        </Card>

        {/* 정산 방식 선택 */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>정산 방식</Text>
          <SettlementMethodSelector
            selectedMethod={method}
            onMethodChange={handleMethodChange}
            hasItems={expense?.items && expense.items.length > 0}
          />
        </Card>

        {/* 2단계: 각 방식별 입력 UI */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>정산 정보 입력</Text>
          <SettlementInputForm
            method={method}
            members={members}
            totalAmount={expense.amount}
            participantIds={participantIds}
            onParticipantsChange={setParticipantIds}
            directEntries={directEntries}
            onDirectEntriesChange={setDirectEntries}
            percentEntries={percentEntries}
            onPercentEntriesChange={setPercentEntries}
          />
        </Card>

        {/* 정산 생성 버튼 */}
        <Button
          title={method === 'ITEM' ? '투표 생성' : '정산 생성'}
          onPress={handleCreateSettlement}
          variant="primary"
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerContainerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  expenseInfo: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    padding: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  expenseValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  submitButton: {
    marginTop: 24,
  },
});
