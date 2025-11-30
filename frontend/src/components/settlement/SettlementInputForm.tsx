import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { GroupMemberDto } from '../../types/group.types';
import {
  SettlementMethod,
  DirectSettlementEntry,
  PercentSettlementEntry,
} from '../../types/settlement.types';
import { COLORS } from '../../constants/colors';
import { ParticipantSelector } from '../common/ParticipantSelector';

/**
 * SettlementInputForm Props 타입 정의
 */
export interface SettlementInputFormProps {
  /** 정산 방식 */
  method: SettlementMethod;
  /** 그룹 멤버 목록 */
  members: GroupMemberDto[];
  /** 총 금액 (검증용) */
  totalAmount: number;
  /** 선택된 참여자 ID 목록 (N분의1) */
  participantIds: number[];
  /** 참여자 변경 콜백 (N분의1) */
  onParticipantsChange: (ids: number[]) => void;
  /** 직접 입력 항목 목록 */
  directEntries: DirectSettlementEntry[];
  /** 직접 입력 변경 콜백 */
  onDirectEntriesChange: (entries: DirectSettlementEntry[]) => void;
  /** 퍼센트 항목 목록 */
  percentEntries: PercentSettlementEntry[];
  /** 퍼센트 변경 콜백 */
  onPercentEntriesChange: (entries: PercentSettlementEntry[]) => void;
}

/**
 * SettlementInputForm 컴포넌트
 * 정산 방식에 따라 다른 입력 UI를 표시합니다.
 */
export const SettlementInputForm: React.FC<SettlementInputFormProps> = ({
  method,
  members,
  totalAmount,
  participantIds,
  onParticipantsChange,
  directEntries,
  onDirectEntriesChange,
  percentEntries,
  onPercentEntriesChange,
}) => {
  /**
   * 직접 입력 금액 변경
   */
  const handleDirectAmountChange = (userId: number, amountStr: string) => {
    const amount = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0;
    const existingIndex = directEntries.findIndex((e) => e.userId === userId);

    if (existingIndex >= 0) {
      const newEntries = [...directEntries];
      newEntries[existingIndex] = { userId, amount };
      onDirectEntriesChange(newEntries);
    } else {
      onDirectEntriesChange([...directEntries, { userId, amount }]);
    }
  };

  /**
   * 퍼센트 입력 비율 변경
   */
  const handlePercentRatioChange = (userId: number, ratioStr: string) => {
    const ratio = parseFloat(ratioStr) || 0;
    const existingIndex = percentEntries.findIndex((e) => e.userId === userId);

    if (existingIndex >= 0) {
      const newEntries = [...percentEntries];
      newEntries[existingIndex] = { userId, ratio };
      onPercentEntriesChange(newEntries);
    } else {
      onPercentEntriesChange([...percentEntries, { userId, ratio }]);
    }
  };

  /**
   * 균등 분배 자동 계산 (N분의1)
   */
  const calculateEqualSplit = (): string => {
    if (participantIds.length === 0) return '0';
    const perPerson = Math.floor(totalAmount / participantIds.length);
    return perPerson.toLocaleString();
  };

  /**
   * 직접 입력 합계 계산
   */
  const calculateDirectTotal = (): number => {
    return directEntries.reduce((sum, entry) => sum + entry.amount, 0);
  };

  /**
   * 퍼센트 합계 계산
   */
  const calculatePercentTotal = (): number => {
    return percentEntries.reduce((sum, entry) => sum + entry.ratio, 0);
  };

  /**
   * 방식별 렌더링
   */
  const renderMethodInput = () => {
    switch (method) {
      case 'N_BUN_1':
        return (
          <View>
            <Text style={styles.description}>
              참여자를 선택하면 금액이 균등하게 분배됩니다.
            </Text>
            <ParticipantSelector
              members={members}
              selectedIds={participantIds}
              onSelectionChange={onParticipantsChange}
              multiSelect
            />
            {participantIds.length > 0 && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>1인당 금액</Text>
                <Text style={styles.infoValue}>{calculateEqualSplit()}원</Text>
              </View>
            )}
          </View>
        );

      case 'DIRECT':
        const directTotal = calculateDirectTotal();
        const directDiff = totalAmount - directTotal;

        return (
          <View>
            <Text style={styles.description}>
              각 참여자가 부담할 금액을 직접 입력하세요.
            </Text>
            <ScrollView style={styles.inputList} nestedScrollEnabled>
              {members.map((member) => {
                const entry = directEntries.find((e) => e.userId === member.user.id);
                const amount = entry?.amount || 0;

                return (
                  <View key={member.user.id} style={styles.inputRow}>
                    <Text style={styles.memberName}>{member.user.name}</Text>
                    <View style={styles.amountInputWrapper}>
                      <TextInput
                        style={styles.amountInput}
                        value={amount > 0 ? amount.toString() : ''}
                        onChangeText={(text) =>
                          handleDirectAmountChange(member.user.id, text)
                        }
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                    <Text style={styles.unit}>원</Text>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>입력 합계</Text>
              <Text
                style={[
                  styles.totalValue,
                  directDiff !== 0 && styles.totalValueError,
                ]}
              >
                {directTotal.toLocaleString()}원
              </Text>
            </View>
            {directDiff !== 0 && (
              <Text style={styles.warningText}>
                {directDiff > 0
                  ? `${Math.abs(directDiff).toLocaleString()}원 부족합니다`
                  : `${Math.abs(directDiff).toLocaleString()}원 초과입니다`}
              </Text>
            )}
          </View>
        );

      case 'PERCENT':
        const percentTotal = calculatePercentTotal();
        const percentDiff = 100 - percentTotal;

        return (
          <View>
            <Text style={styles.description}>
              각 참여자의 부담 비율을 입력하세요. (합계 100%)
            </Text>
            <ScrollView style={styles.inputList} nestedScrollEnabled>
              {members.map((member) => {
                const entry = percentEntries.find((e) => e.userId === member.user.id);
                const ratio = entry?.ratio || 0;
                const calculatedAmount = Math.floor((totalAmount * ratio) / 100);

                return (
                  <View key={member.user.id} style={styles.inputRow}>
                    <Text style={styles.memberName}>{member.user.name}</Text>
                    <View style={styles.percentInputContainer}>
                      <View style={styles.percentInputWrapper}>
                        <TextInput
                          style={styles.percentInput}
                          value={ratio > 0 ? ratio.toString() : ''}
                          onChangeText={(text) =>
                            handlePercentRatioChange(member.user.id, text)
                          }
                          placeholder="0"
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <Text style={styles.unit}>%</Text>
                      <Text style={styles.calculatedAmount}>
                        ({calculatedAmount.toLocaleString()}원)
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>비율 합계</Text>
              <Text
                style={[
                  styles.totalValue,
                  percentDiff !== 0 && styles.totalValueError,
                ]}
              >
                {percentTotal.toFixed(1)}%
              </Text>
            </View>
            {percentDiff !== 0 && (
              <Text style={styles.warningText}>
                {percentDiff > 0
                  ? `${Math.abs(percentDiff).toFixed(1)}% 부족합니다`
                  : `${Math.abs(percentDiff).toFixed(1)}% 초과입니다`}
              </Text>
            )}
          </View>
        );

      case 'ITEM':
        return (
          <View>
            <Text style={styles.description}>
              항목별 정산은 투표를 생성하여 진행됩니다.
            </Text>
            <Text style={styles.infoText}>
              "정산 생성" 버튼을 누르면 투표가 생성되며, 그룹 멤버들이 각자
              선택한 항목에 따라 금액이 분배됩니다.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderMethodInput()}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inputList: {
    maxHeight: 300,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  amountInputWrapper: {
    width: 120,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
    marginRight: 8,
  },
  amountInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text.primary,
    textAlign: 'right',
  },
  percentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentInputWrapper: {
    width: 60,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
    marginRight: 4,
  },
  percentInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text.primary,
    textAlign: 'right',
  },
  unit: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginRight: 8,
  },
  calculatedAmount: {
    fontSize: 13,
    color: COLORS.text.tertiary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.border.default,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalValueError: {
    color: COLORS.system.error,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.system.error,
    marginTop: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    lineHeight: 20,
    marginTop: 8,
  },
});
