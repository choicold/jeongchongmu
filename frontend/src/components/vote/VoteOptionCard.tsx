import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { VoteOptionDto } from '../../types/vote.types';
import { COLORS } from '../../constants/colors';

/**
 * VoteOptionCard Props
 */
export interface VoteOptionCardProps {
  /** 투표 선택지 */
  option: VoteOptionDto;
  /** 선택 여부 */
  isSelected: boolean;
  /** 선택/해제 토글 핸들러 */
  onToggle: () => void;
  /** 투표한 사용자 이름 목록 (userId를 이름으로 변환한 것) */
  votedUserNames?: string[];
  /** 비활성화 여부 (readonly 모드) */
  disabled?: boolean;
}

/**
 * VoteOptionCard 컴포넌트
 *
 * 투표 선택지를 카드 형태로 표시하고 체크박스로 선택할 수 있습니다.
 * 이미 투표한 사람들의 이름도 표시됩니다.
 *
 * @example
 * ```tsx
 * <VoteOptionCard
 *   option={{
 *     optionId: 1,
 *     itemName: "치킨",
 *     price: 20000,
 *     votedUserIds: [1, 2, 3]
 *   }}
 *   isSelected={selectedOptions.includes(1)}
 *   onToggle={() => toggleOption(1)}
 *   votedUserNames={["철수", "영희", "민수"]}
 * />
 * ```
 */
export const VoteOptionCard: React.FC<VoteOptionCardProps> = ({
  option,
  isSelected,
  onToggle,
  votedUserNames = [],
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onToggle}
      activeOpacity={disabled ? 1 : 0.7}
      style={styles.cardContainer}
      disabled={disabled}
    >
      <Card style={[styles.card, isSelected ? styles.cardSelected : undefined]}>
        <View style={styles.content}>
          {/* 체크박스 + 항목 정보 */}
          <View style={styles.header}>
            {/* 체크박스 */}
            <View
              style={[
                styles.checkbox,
                isSelected ? styles.checkboxSelected : undefined,
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>

            {/* 항목 이름 */}
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {option.itemName}
              </Text>
              <Text style={styles.price}>
                {option.price.toLocaleString()}원
              </Text>
            </View>
          </View>

          {/* 투표한 사람들 */}
          {votedUserNames.length > 0 && (
            <View style={styles.votersContainer}>
              <Ionicons
                name="people-outline"
                size={14}
                color={COLORS.text.tertiary}
              />
              <Text style={styles.votersText}>
                {votedUserNames.join(', ')} 선택함
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  itemNameSelected: {
    color: COLORS.primary,
  },
  price: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  votersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  votersText: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    marginLeft: 6,
  },
});
