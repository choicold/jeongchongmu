import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { ExpenseSimpleDTO } from '../../types/expense.types';
import { formatDate } from '../../utils/dateFormatter';
import { COLORS } from '../../constants/colors';

/**
 * ExpenseCard Props 타입 정의
 */
export interface ExpenseCardProps {
  /** 지출 정보 */
  expense: ExpenseSimpleDTO;
  /** 카드 클릭 핸들러 */
  onPress: () => void;
}

/**
 * 카테고리별 아이콘 반환 (Ionicons)
 */
const getCategoryIcon = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('식사') || lowerTitle.includes('음식') || lowerTitle.includes('회식')) return 'restaurant';
  if (lowerTitle.includes('카페') || lowerTitle.includes('커피')) return 'cafe';
  if (lowerTitle.includes('교통') || lowerTitle.includes('택시')) return 'car';
  if (lowerTitle.includes('숙박') || lowerTitle.includes('호텔')) return 'bed';
  return 'cash';
};

/**
 * ExpenseCard 컴포넌트
 * 지출 항목을 카드 형태로 표시합니다.
 *
 * @example
 * ```tsx
 * <ExpenseCard
 *   expense={{
 *     id: 1,
 *     title: "회식비",
 *     amount: 50000,
 *     payerName: "홍길동",
 *     expenseData: "2025-01-15T18:00:00Z"
 *   }}
 *   onPress={() => navigation.navigate('ExpenseDetail', { expenseId: 1 })}
 * />
 * ```
 */
export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onPress }) => {
  const categoryIcon = getCategoryIcon(expense.title);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={categoryIcon as any}
              size={20}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {expense.title}
            </Text>
            <Text style={styles.subtitle}>
              {expense.payerName} • {formatDate(expense.expenseData)}
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>
          {expense.amount.toLocaleString()}원
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});
