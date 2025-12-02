import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
import { SettlementDetailCard } from '../../components/settlement/SettlementDetailCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { CustomDialog, DialogButton } from '../../components/common';
import { SettlementResponse, SettlementDetailDto } from '../../types/settlement.types';
import * as DeepLinkService from '../../services/DeepLinkService';
import * as settlementApi from '../../services/api/settlementApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../constants/colors';

type Props = NativeStackScreenProps<GroupsStackParamList, 'SettlementDetail'>;

/**
 * SettlementDetailScreen - 정산 결과 화면
 *
 * 정산 결과를 표시하고 송금 기능을 제공합니다.
 * "누가 누구에게 얼마를 보내야 하는지" 상세 내역을 보여줍니다.
 */
export const SettlementDetailScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { settlementId } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();

  // settlementId 유효성 검사
  useEffect(() => {
    if (!settlementId || isNaN(settlementId) || settlementId <= 0) {
      showToast('잘못된 정산 정보입니다.', 'error');
      navigation.goBack();
    }
  }, [settlementId]);

  // State
  const [settlementData, setSettlementData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [transferDialogVisible, setTransferDialogVisible] = useState(false);
  const [transferDialogData, setTransferDialogData] = useState<SettlementDetailDto | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<SettlementDetailDto | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // 송금 대기 중인 정산 내역 추적
  const pendingTransferRef = useRef<SettlementDetailDto | null>(null);
  const appState = useRef(AppState.currentState);

  /**
   * 화면 진입 시 정산 정보 로드
   */
  useEffect(() => {
    fetchSettlement();
  }, [settlementId]);

  /**
   * AppState 변경 감지 - 토스 앱에서 돌아왔을 때 송금 확인
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // 백그라운드에서 포그라운드로 전환될 때
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        pendingTransferRef.current
      ) {
        // 약간의 지연을 두고 Alert 표시 (화면 전환 완료 대기)
        setTimeout(() => {
          showTransferConfirmation(pendingTransferRef.current!);
          pendingTransferRef.current = null;
        }, 500);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [settlementId]);

  /**
   * 정산 정보 조회
   */
  const fetchSettlement = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await settlementApi.getSettlement(settlementId);
      setSettlementData(data);
    } catch (err: any) {
      console.error('정산 정보 조회 에러:', err);
      setError(err.message || '정산 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 정산 방식 한글 변환
   */
  const getMethodLabel = (method: string): string => {
    switch (method) {
      case 'N_BUN_1':
        return 'N분의 1';
      case 'DIRECT':
        return '직접 입력';
      case 'PERCENT':
        return '퍼센트';
      case 'ITEM':
        return '항목별';
      default:
        return method;
    }
  };

  /**
   * 정산 상태 한글 변환
   */
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '정산 중';
      case 'COMPLETED':
        return '정산 완료';
      default:
        return status;
    }
  };

  /**
   * 정산 상태 색상
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return COLORS.system.warning;
      case 'COMPLETED':
        return COLORS.system.success;
      default:
        return COLORS.text.secondary;
    }
  };

  /**
   * 송금 완료 확인 다이얼로그 표시
   */
  const showTransferConfirmation = (detail: SettlementDetailDto) => {
    setConfirmDialogData(detail);
    setConfirmDialogVisible(true);
  };

  /**
   * 송금 완료 확인 처리
   */
  const handleConfirmTransfer = async () => {
    if (!confirmDialogData) return;

    try {
      setLoading(true);
      // 송금 확인 API 호출
      const updated = await settlementApi.confirmTransfer(
        settlementId,
        confirmDialogData.debtorId,
        confirmDialogData.creditorId
      );

      // 정산 데이터 업데이트
      setSettlementData(updated);

      // 상태 메시지 표시
      if (updated.status === 'COMPLETED') {
        showToast('모든 멤버의 송금이 완료되어 정산이 완료되었습니다!', 'success', 4000);
      } else {
        showToast('송금이 확인되었습니다.', 'success');
      }
    } catch (error: any) {
      console.error('송금 확인 에러:', error);
      showToast(error.message || '송금 확인에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 송금하기 버튼 클릭 핸들러
   */
  const handleTransfer = async (detail: SettlementDetailDto) => {
    if (!detail.creditorBankName || !detail.creditorAccountNumber) {
      showToast('계좌 정보가 없습니다.', 'error');
      return;
    }

    // 송금 확인 다이얼로그 표시
    setTransferDialogData(detail);
    setTransferDialogVisible(true);
  };

  /**
   * 토스로 이동 처리
   */
  const handleGoToToss = () => {
    if (!transferDialogData) return;

    // 송금 대기 중인 내역 저장
    pendingTransferRef.current = transferDialogData;

    // 토스 송금 화면으로 이동
    DeepLinkService.openTossTransfer(
      transferDialogData.creditorBankName!,
      transferDialogData.creditorAccountNumber!,
      transferDialogData.amount,
      `${transferDialogData.debtorName} → ${transferDialogData.creditorName} 정산`
    );
  };

  /**
   * 정산 삭제 핸들러
   */
  const handleDelete = () => {
    setDeleteDialogVisible(true);
  };

  /**
   * 정산 삭제 확인 처리
   */
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await settlementApi.deleteSettlement(settlementId);
      showToast('정산이 삭제되었습니다.', 'success');
      navigation.goBack();
    } catch (error: any) {
      console.error('정산 삭제 에러:', error);
      showToast(error.message || '정산 삭제에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 정산 세부 내역 렌더링
   */
  const renderDetailItem = ({ item }: { item: SettlementDetailDto }) => {
    return (
      <SettlementDetailCard
        detail={item}
        onTransfer={() => handleTransfer(item)}
        currentUserName={user?.name}
        settlementStatus={settlementData?.status}
      />
    );
  };

  /**
   * 현재 사용자에게 보여줄 정산 내역 필터링
   * - 정산 생성자 (채권자)인 경우: 모든 내역 표시
   * - 일반 참여자 (채무자)인 경우: 자신이 보낼 금액만 표시
   */
  const getFilteredDetails = (): SettlementDetailDto[] => {
    if (!settlementData || !user) return [];

    const { details } = settlementData;

    // 현재 사용자가 채권자(정산 생성자/지출한 사람)인지 확인
    const isCreator = details.some(d => d.creditorName === user.name);

    if (isCreator) {
      // 정산 생성자는 모든 내역을 볼 수 있음
      return details;
    } else {
      // 일반 참여자는 자신이 채무자인 내역만 표시
      return details.filter(d => d.debtorName === user.name);
    }
  };

  /**
   * 빈 목록 렌더링
   */
  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="checkmark-circle-outline"
          size={64}
          color={COLORS.text.tertiary}
        />
        <Text style={styles.emptyTitle}>정산이 완료되었습니다</Text>
        <Text style={styles.emptySubtitle}>
          모든 송금이 완료되었습니다
        </Text>
      </View>
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="정산 정보를 불러오는 중..." />;
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
        onRetry={fetchSettlement}
      />
    );
  }

  /**
   * 정산 정보가 없는 경우
   */
  if (!settlementData) {
    return (
      <ErrorMessage message="정산 정보를 찾을 수 없습니다." fullScreen />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 바 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>정산 결과</Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={24} color={COLORS.system.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 서브 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            송금할 내역을 확인하세요
          </Text>
        </View>

        {/* 정산 요약 */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>정산 정보</Text>

          {/* 총 금액 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>총 금액</Text>
            <Text style={[styles.summaryValue, styles.amountText]}>
              {settlementData.totalAmount.toLocaleString()}원
            </Text>
          </View>

          {/* 정산 방식 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>정산 방식</Text>
            <Text style={styles.summaryValue}>
              {getMethodLabel(settlementData.method)}
            </Text>
          </View>

          {/* 정산 상태 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>상태</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    settlementData.status === 'COMPLETED'
                      ? COLORS.system.success
                      : COLORS.system.warning,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(settlementData.status)}
              </Text>
            </View>
          </View>

          {/* 세부 내역 개수 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>송금 건수</Text>
            <Text style={styles.summaryValue}>
              {getFilteredDetails().length}건
            </Text>
          </View>
        </Card>

        {/* 세부 내역 리스트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>송금 내역</Text>

          {getFilteredDetails().length === 0 ? (
            renderEmptyList()
          ) : (
            getFilteredDetails().map((item, index) => (
              <View key={`${item.debtorId}-${item.creditorId}-${index}`}>
                {renderDetailItem({ item })}
              </View>
            ))
          )}
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            "송금하기" 버튼을 누르면 토스 앱으로 이동합니다.{'\n'}
            계좌 정보가 자동으로 입력됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* 송금하기 확인 다이얼로그 */}
      <CustomDialog
        visible={transferDialogVisible}
        title="송금하기"
        message={
          transferDialogData
            ? `${transferDialogData.creditorName}님에게 ${transferDialogData.amount.toLocaleString()}원을 송금하시겠습니까?\n\n토스 앱으로 이동하여 송금을 완료한 후 앱으로 돌아오면 송금 확인 메시지가 표시됩니다.`
            : ''
        }
        buttons={[
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '토스로 이동',
            style: 'default',
            onPress: handleGoToToss,
          },
        ]}
        onDismiss={() => setTransferDialogVisible(false)}
      />

      {/* 송금 완료 확인 다이얼로그 */}
      <CustomDialog
        visible={confirmDialogVisible}
        title="송금 확인"
        message="송금을 완료하셨나요?"
        buttons={[
          {
            text: '아니오',
            style: 'cancel',
          },
          {
            text: '완료',
            style: 'default',
            onPress: handleConfirmTransfer,
          },
        ]}
        onDismiss={() => setConfirmDialogVisible(false)}
      />

      {/* 정산 삭제 확인 다이얼로그 */}
      <CustomDialog
        visible={deleteDialogVisible}
        title="정산 삭제"
        message="정산을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        buttons={[
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: handleConfirmDelete,
          },
        ]}
        onDismiss={() => setDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: COLORS.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 12,
    lineHeight: 20,
  },
});
