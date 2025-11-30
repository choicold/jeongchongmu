import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { SettlementDetailDto } from '../../types/settlement.types';
import { COLORS } from '../../constants/colors';

/**
 * SettlementDetailCard Props
 */
export interface SettlementDetailCardProps {
  /** 정산 세부 내역 */
  detail: SettlementDetailDto;
  /** 송금하기 버튼 클릭 핸들러 */
  onTransfer: () => void;
  /** 현재 사용자 ID (선택) */
  currentUserId?: number;
  /** 현재 사용자 이름 (선택) */
  currentUserName?: string;
  /** 정산 상태 (선택) */
  settlementStatus?: string;
}

/**
 * SettlementDetailCard 컴포넌트
 *
 * 정산 세부 내역을 표시하고 송금 기능을 제공합니다.
 * "채무자 → 채권자: 금액 [송금하기]" 형태로 표시됩니다.
 *
 * @example
 * ```tsx
 * <SettlementDetailCard
 *   detail={{
 *     debtorName: "철수",
 *     creditorName: "영희",
 *     amount: 10000,
 *     isSent: false,
 *     creditorBankName: "카카오뱅크",
 *     creditorAccountNumber: "3333-12-3456789",
 *   }}
 *   onTransfer={() => handleTransfer(detail)}
 * />
 * ```
 */
export const SettlementDetailCard: React.FC<SettlementDetailCardProps> = ({
  detail,
  onTransfer,
  currentUserId,
  currentUserName,
  settlementStatus,
}) => {
  // 현재 사용자가 채권자(받는 사람)인지 확인
  const isCreditor = currentUserName === detail.creditorName;

  // 정산이 완료되었는지 확인
  const isSettlementCompleted = settlementStatus === 'COMPLETED';

  return (
    <Card style={styles.card}>
      {/* 송금 정보 */}
      <View style={styles.transferInfo}>
        {/* 채무자 → 채권자 */}
        <View style={styles.transferRow}>
          <View style={styles.personContainer}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={COLORS.system.error}
            />
            <Text style={styles.debtorName}>{detail.debtorName}</Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={20}
            color={COLORS.text.tertiary}
            style={styles.arrowIcon}
          />

          <View style={styles.personContainer}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={COLORS.system.success}
            />
            <Text style={styles.creditorName}>{detail.creditorName}</Text>
          </View>
        </View>

        {/* 금액 */}
        <Text style={styles.amount}>{detail.amount.toLocaleString()}원</Text>
      </View>

      {/* 계좌 정보 */}
      {detail.creditorBankName && detail.creditorAccountNumber && !isCreditor && (
        <View style={styles.accountInfo}>
          <View style={styles.accountRow}>
            <Ionicons
              name="card-outline"
              size={16}
              color={COLORS.text.secondary}
            />
            <Text style={styles.accountLabel}>받는 계좌</Text>
          </View>
          <Text style={styles.accountValue}>
            {detail.creditorBankName} {detail.creditorAccountNumber}
          </Text>
        </View>
      )}

      {/* 송금 상태 또는 버튼 */}
      {isCreditor ? (
        // 현재 사용자가 채권자(받는 사람)인 경우
        <View style={styles.receiverContainer}>
          <Ionicons
            name="cash-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.receiverText}>
            {detail.isSent || isSettlementCompleted ? '송금 받음' : '송금 대기 중'}
          </Text>
        </View>
      ) : detail.isSent || isSettlementCompleted ? (
        // 송금이 완료된 경우 또는 정산이 완료된 경우
        <View style={styles.sentContainer}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COLORS.system.success}
          />
          <Text style={styles.sentText}>송금 완료</Text>
        </View>
      ) : (
        // 송금 버튼
        <TouchableOpacity
          style={styles.transferButton}
          onPress={onTransfer}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={18} color={COLORS.white} />
          <Text style={styles.transferButtonText}>송금하기</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  transferInfo: {
    marginBottom: 16,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  creditorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  accountInfo: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  accountLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: 22, // icon size + marginLeft
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  transferButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  sentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.system.success,
  },
  sentText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.system.success,
    marginLeft: 8,
  },
  receiverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  receiverText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
});
