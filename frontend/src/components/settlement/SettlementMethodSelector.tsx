import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettlementMethod } from '../../types/settlement.types';
import { COLORS } from '../../constants/colors';

/**
 * SettlementMethodSelector Props
 */
export interface SettlementMethodSelectorProps {
  /** 현재 선택된 정산 방식 */
  selectedMethod: SettlementMethod;
  /** 정산 방식 변경 핸들러 */
  onMethodChange: (method: SettlementMethod) => void;
  /** 세부 항목 존재 여부 (항목별 정산 활성화 조건) */
  hasItems?: boolean;
}

/**
 * 정산 방식 옵션 정의
 */
const SETTLEMENT_METHODS = [
  {
    value: 'N_BUN_1' as SettlementMethod,
    label: 'N분의 1',
    description: '모든 참여자가 균등하게 부담합니다',
    icon: 'people-outline' as const,
  },
  {
    value: 'DIRECT' as SettlementMethod,
    label: '직접 입력',
    description: '각 참여자별로 금액을 직접 입력합니다',
    icon: 'cash-outline' as const,
  },
  {
    value: 'PERCENT' as SettlementMethod,
    label: '퍼센트',
    description: '각 참여자별로 비율(%)을 지정합니다',
    icon: 'pie-chart-outline' as const,
  },
  {
    value: 'ITEM' as SettlementMethod,
    label: '항목별',
    description: '투표로 각자 먹은 항목을 선택합니다',
    icon: 'checkmark-circle-outline' as const,
  },
];

/**
 * SettlementMethodSelector 컴포넌트
 *
 * 정산 방식을 선택하는 라디오 버튼 그룹입니다.
 *
 * @example
 * ```tsx
 * <SettlementMethodSelector
 *   selectedMethod={method}
 *   onMethodChange={setMethod}
 * />
 * ```
 */
export const SettlementMethodSelector: React.FC<SettlementMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  hasItems = true, // 기본값: 세부 항목 있음
}) => {
  return (
    <View style={styles.container}>
      {SETTLEMENT_METHODS.map((option) => {
        const isSelected = selectedMethod === option.value;
        const isDisabled = option.value === 'ITEM' && !hasItems;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              isDisabled && styles.optionDisabled,
            ]}
            onPress={() => !isDisabled && onMethodChange(option.value)}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            {/* 라디오 버튼 + 아이콘 */}
            <View style={styles.optionHeader}>
              <View style={styles.leftSection}>
                {/* 라디오 버튼 */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                {/* 아이콘 */}
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={
                    isDisabled
                      ? COLORS.text.tertiary
                      : isSelected
                      ? COLORS.primary
                      : COLORS.text.secondary
                  }
                />

                {/* 라벨 */}
                <Text
                  style={[
                    styles.label,
                    isSelected && styles.labelSelected,
                    isDisabled && styles.labelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
              </View>
            </View>

            {/* 설명 */}
            <Text
              style={[
                styles.description,
                isSelected && styles.descriptionSelected,
                isDisabled && styles.descriptionDisabled,
              ]}
            >
              {isDisabled
                ? '항목별 정산은 세부 항목이 있는 지출만 가능합니다'
                : option.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  option: {
    backgroundColor: COLORS.background.default,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background.secondary,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  labelSelected: {
    color: COLORS.primary,
  },
  description: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    marginLeft: 44, // radioOuter width + marginRight + icon size
    lineHeight: 18,
  },
  descriptionSelected: {
    color: COLORS.text.secondary,
  },
  optionDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.background.tertiary,
  },
  labelDisabled: {
    color: COLORS.text.tertiary,
  },
  descriptionDisabled: {
    color: COLORS.text.tertiary,
  },
});
