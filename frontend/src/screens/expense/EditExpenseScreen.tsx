import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ExpenseItemEditor } from '../../components/expense/ExpenseItemEditor';
import { ParticipantSelector } from '../../components/common/ParticipantSelector';
import { TagSelector } from '../../components/common/TagSelector';
import { CustomDateTimePicker } from '../../components/common/DateTimePicker';
import * as expenseApi from '../../services/api/expenseApi';
import * as groupMemberApi from '../../services/api/groupMemberApi';
import { formatDateTime } from '../../utils/dateFormatter';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { COLORS } from '../../constants/colors';
import { ExpenseItemDTO } from '../../types/expense.types';
import { GroupMemberDto } from '../../types/group.types';

type Props = NativeStackScreenProps<GroupsStackParamList, 'EditExpense'>;

/**
 * EditExpenseScreen - 지출 수정 화면 (완전 개선 버전)
 *
 * 지출 생성 화면과 동일한 형태로 모든 항목을 수정할 수 있습니다.
 */
export const EditExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { expenseId } = route.params;
  const { showToast } = useToast();
  const { refreshExpenses, invalidateExpense } = useData();

  // === State ===
  const [groupId, setGroupId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState<ExpenseItemDTO[]>([]);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [amountError, setAmountError] = useState('');

  /**
   * 화면 진입 시 지출 정보 로드
   */
  useEffect(() => {
    fetchExpenseData();
  }, [expenseId]);

  /**
   * 그룹 멤버 로드
   */
  useEffect(() => {
    if (groupId) {
      fetchMembers();
    }
  }, [groupId]);

  /**
   * 지출 정보 조회
   */
  const fetchExpenseData = async () => {
    try {
      setError('');
      setLoading(true);

      const expenseData = await expenseApi.getExpenseDetail(expenseId);

      setGroupId(expenseData.groupId);
      setTitle(expenseData.title);
      setAmount(expenseData.amount.toLocaleString());
      setExpenseDate(new Date(expenseData.expenseData));

      // 세부 항목 설정
      if (expenseData.items && expenseData.items.length > 0) {
        setItems(expenseData.items);
      }

      // 참여자 ID 설정
      if (expenseData.participantIds && expenseData.participantIds.length > 0) {
        setParticipantIds(expenseData.participantIds);
      }

      // 태그 설정
      if (expenseData.tagNames && expenseData.tagNames.length > 0) {
        setTagNames(expenseData.tagNames);
      }
    } catch (err: any) {
      console.error('지출 정보 조회 에러:', err);
      setError(err.message || '지출 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 그룹 멤버 조회
   */
  const fetchMembers = async () => {
    if (!groupId) return;

    try {
      setMembersLoading(true);
      const membersData = await groupMemberApi.getGroupMembers(groupId);
      setMembers(membersData);
    } catch (error: any) {
      console.error('멤버 조회 에러:', error);
      showToast('그룹 멤버를 불러오는데 실패했습니다.', 'error');
    } finally {
      setMembersLoading(false);
    }
  };

  /**
   * 날짜 선택 핸들러
   */
  const handleDateChange = (selectedDate: Date) => {
    setExpenseDate(selectedDate);
  };

  /**
   * 입력값 검증
   */
  const validateInputs = (): boolean => {
    let isValid = true;

    // 제목 검증
    if (!title.trim()) {
      setTitleError('제목을 입력해주세요.');
      isValid = false;
    } else {
      setTitleError('');
    }

    // 금액 검증
    const amountNum = parseInt(amount.replace(/,/g, ''), 10);
    if (!amount.trim()) {
      setAmountError('금액을 입력해주세요.');
      isValid = false;
    } else if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('올바른 금액을 입력해주세요.');
      isValid = false;
    } else {
      setAmountError('');
    }

    return isValid;
  };

  /**
   * 금액 포맷팅 (천 단위 콤마)
   */
  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setAmount('');
      setAmountError('');
      return;
    }
    const formattedValue = parseInt(numericValue, 10).toLocaleString();
    setAmount(formattedValue);
    setAmountError('');
  };

  /**
   * 지출 수정 처리
   */
  const handleUpdateExpense = async () => {
    if (!validateInputs()) {
      return;
    }

    // 참여자 선택 검증
    if (participantIds.length === 0) {
      showToast('참여자를 최소 1명 이상 선택해주세요.', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      await expenseApi.updateExpense(expenseId, {
        title: title.trim(),
        amount: parseInt(amount.replace(/,/g, ''), 10),
        expenseData: expenseDate.toISOString(),
        participantIds: participantIds,
        items: items.length > 0 ? items : [],
        tagNames: tagNames.length > 0 ? tagNames : [],
      });

      // 데이터 컨텍스트 갱신
      if (groupId) {
        await refreshExpenses(groupId);
      }
      invalidateExpense(expenseId);

      showToast('지출 정보가 수정되었습니다.', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (err: any) {
      console.error('지출 수정 에러:', err);
      showToast(err.message || '지출 수정에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
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
        onRetry={fetchExpenseData}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지출 수정</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* 금액 입력 섹션 (최상단, 강조) */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>지출 금액</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₩</Text>
              <TextInput
                value={amount}
                onChangeText={formatAmount}
                placeholder="0"
                placeholderTextColor={COLORS.text.tertiary}
                keyboardType="numeric"
                style={[
                  styles.amountInput,
                  amountError ? styles.amountInputError : null,
                ]}
                autoFocus={false}
                returnKeyType="done"
              />
            </View>
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
          </View>

          <View style={styles.formContainer}>
            {/* 기본 정보 섹션 */}
            <View style={styles.section}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>내용 *</Text>
                <Input
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setTitleError('');
                  }}
                  placeholder="지출 내용을 입력해주세요"
                  error={titleError}
                  returnKeyType="done"
                />
              </View>

              {/* 날짜 선택 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>날짜</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.text.secondary}
                    style={styles.dateIcon}
                  />
                  <Text style={styles.dateText}>
                    {formatDateTime(expenseDate.toISOString())}
                  </Text>
                  <Ionicons
                    name={showDatePicker ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={COLORS.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* CustomDateTimePicker */}
              <CustomDateTimePicker
                value={expenseDate}
                onChange={handleDateChange}
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
              />
            </View>

            {/* 세부 항목 섹션 */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>세부 항목 (선택사항)</Text>
              <ExpenseItemEditor
                items={items}
                onItemsChange={setItems}
                showTotal
              />
            </View>

            {/* 참여자 선택 섹션 */}
            <View style={styles.section}>
              {membersLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>멤버 목록 로딩 중...</Text>
                </View>
              ) : (
                <ParticipantSelector
                  members={members}
                  selectedIds={participantIds}
                  onSelectionChange={setParticipantIds}
                  multiSelect
                />
              )}
            </View>

            {/* 태그 선택 섹션 */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>태그 (선택사항)</Text>
              <TagSelector selectedTags={tagNames} onTagsChange={setTagNames} />
            </View>
          </View>

          {/* 하단 수정 버튼 */}
          <View style={styles.footer}>
            <Button
              title="수정하기"
              onPress={handleUpdateExpense}
              variant="primary"
              loading={submitting}
              disabled={
                submitting ||
                !title.trim() ||
                !amount.trim() ||
                participantIds.length === 0
              }
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 120,
  },
  // 금액 입력 섹션 (상단 강조)
  amountSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text.primary,
    padding: 0,
    margin: 0,
  },
  amountInputError: {
    color: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8,
    marginLeft: 4,
  },
  // 폼 컨테이너
  formContainer: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  // 날짜 버튼
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  // 하단 버튼
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  submitButton: {
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
