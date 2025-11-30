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
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ExpenseItemEditor } from '../../components/expense/ExpenseItemEditor';
import { ParticipantSelector } from '../../components/common/ParticipantSelector';
import { TagSelector } from '../../components/common/TagSelector';
import { CustomDateTimePicker } from '../../components/common/DateTimePicker';
import { formatDateTime } from '../../utils/dateFormatter';
import { COLORS } from '../../constants/colors';
import { ExpenseItemDTO } from '../../types/expense.types';
import { GroupMemberDto } from '../../types/group.types';
import * as expenseApi from '../../services/api/expenseApi';
import * as groupMemberApi from '../../services/api/groupMemberApi';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateExpense'>;

/**
 * CreateExpenseScreen - 지출 등록 화면 (완전 개선 버전)
 *
 * 주요 개선사항:
 * 1. 금액 입력을 가장 상단에 크게 배치
 * 2. KeyboardAvoidingView + ScrollView 구조 최적화
 * 3. TagSelector 추가
 * 4. 모든 입력 필드가 명확하게 보이도록 개선
 * 5. API DTO 타입과 정확히 매칭
 */
export const CreateExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, ocrResult } = route.params;
  const { refreshExpenses, invalidateExpense } = useData();
  const { showToast } = useToast();

  // === 1단계: 기본 State ===
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // === 2단계: 세부 항목 State ===
  const [items, setItems] = useState<ExpenseItemDTO[]>([]);

  // === 3단계: 참여자 선택 State ===
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // === 4단계: 태그 선택 State ===
  const [tagNames, setTagNames] = useState<string[]>([]);

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [amountError, setAmountError] = useState('');

  /**
   * 날짜 선택 핸들러
   */
  const handleDateChange = (selectedDate: Date) => {
    setExpenseDate(selectedDate);
  };

  /**
   * 그룹 멤버 로드
   */
  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  /**
   * OCR 결과로 초기값 설정
   */
  useEffect(() => {
    if (ocrResult) {
      // 제목 설정
      if (ocrResult.title) {
        setTitle(ocrResult.title);
      }

      // 금액 설정 (천 단위 콤마 포함)
      if (ocrResult.amount) {
        setAmount(ocrResult.amount.toLocaleString());
      }

      // 날짜 설정
      if (ocrResult.expenseData) {
        try {
          const parsedDate = new Date(ocrResult.expenseData);
          if (!isNaN(parsedDate.getTime())) {
            setExpenseDate(parsedDate);
          }
        } catch (error) {
          console.error('날짜 파싱 에러:', error);
        }
      }

      // 세부 항목 설정
      if (ocrResult.items && ocrResult.items.length > 0) {
        setItems(ocrResult.items);
      }
    }
  }, [ocrResult]);

  /**
   * 세부 항목 금액 변경 시 총 지출 금액 자동 반영 (직접 입력 모드만)
   */
  useEffect(() => {
    // OCR 결과가 없고 세부 항목이 있을 때만 자동 계산
    if (!ocrResult && items.length > 0) {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      setAmount(totalAmount.toLocaleString());
    }
  }, [items, ocrResult]);

  /**
   * 그룹 멤버 조회
   */
  const fetchMembers = async () => {
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
   * 지출 등록 처리
   */
  const handleCreateExpense = async () => {
    if (!validateInputs()) {
      return;
    }

    // 참여자 선택 검증
    if (participantIds.length === 0) {
      showToast('참여자를 최소 1명 이상 선택해주세요.', 'warning');
      return;
    }

    // 세부 항목이 있을 경우 합계 검증
    if (items.length > 0) {
      const itemsTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const totalAmount = parseInt(amount.replace(/,/g, ''), 10);

      if (itemsTotal !== totalAmount) {
        Alert.alert(
          '금액 불일치',
          `총 금액(${totalAmount.toLocaleString()}원)과 세부 항목 합계(${itemsTotal.toLocaleString()}원)가 일치하지 않습니다. 계속하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '계속', onPress: () => submitExpense() },
          ]
        );
        return;
      }
    }

    await submitExpense();
  };

  /**
   * 지출 등록 API 호출
   * ExpenseCreateDTO 타입과 정확히 매칭
   */
  const submitExpense = async () => {
    try {
      setLoading(true);

      // ExpenseCreateDTO 타입에 맞게 데이터 구성
      const expenseData = {
        title: title.trim(),
        amount: parseInt(amount.replace(/,/g, ''), 10), // number로 변환
        expenseData: expenseDate.toISOString(), // ISO 8601 format
        groupId: groupId, // number
        participantIds: participantIds, // number[]
        items: items.length > 0 ? items : [], // ExpenseItemDTO[]
        tagNames: tagNames.length > 0 ? tagNames : [], // string[]
      };

      console.log('지출 등록 데이터:', expenseData);

      const createdExpense = await expenseApi.createExpense(expenseData);

      // 데이터 컨텍스트 갱신 (반응형 업데이트)
      await refreshExpenses(groupId);

      // Toast 표시 후 자동으로 상세 페이지로 이동
      showToast('지출이 등록되었습니다.', 'success');

      // 약간의 딜레이 후 이동 (Toast를 볼 수 있도록)
      setTimeout(() => {
        navigation.replace('ExpenseDetail', { expenseId: createdExpense.id });
      }, 500);
    } catch (error: any) {
      console.error('지출 등록 에러:', error);
      showToast(error.message || '지출 등록에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>지출 등록</Text>
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

            {/* OCR 결과 표시 (있을 경우) */}
            {ocrResult && (
              <View style={styles.ocrResultCard}>
                <View style={styles.ocrHeader}>
                  <View style={styles.ocrBadge}>
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  </View>
                  <Text style={styles.ocrTitle}>영수증 자동 인식됨</Text>
                </View>
                <Text style={styles.ocrDescription}>
                  아래에서 인식된 내용을 확인하고 수정할 수 있습니다.
                </Text>
              </View>
            )}

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

          {/* 하단 등록 버튼 */}
          <View style={styles.footer}>
            <Button
              title="지출 등록하기"
              onPress={handleCreateExpense}
              variant="primary"
              loading={loading}
              disabled={
                loading ||
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  roundedInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    backgroundColor: COLORS.white,
  },
  selectAllButton: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  // OCR 결과 카드
  ocrResultCard: {
    backgroundColor: '#ECFDF5', // emerald-50
    borderWidth: 1,
    borderColor: '#A7F3D0', // emerald-200
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  ocrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ocrBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ocrTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857', // emerald-700
  },
  ocrDescription: {
    fontSize: 13,
    color: '#047857', // emerald-700
    marginTop: 8,
    lineHeight: 18,
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
