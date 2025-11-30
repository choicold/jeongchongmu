import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpenseItemDTO } from '../../types/expense.types';
import { COLORS } from '../../constants/colors';

/**
 * ExpenseItemList Props 타입 정의
 */
export interface ExpenseItemListProps {
  /** 지출 세부 항목 리스트 */
  items: ExpenseItemDTO[];
  /** 합계 표시 여부 */
  showTotal?: boolean;
}

/**
 * ExpenseItemList 컴포넌트
 * 지출의 세부 항목(품목) 리스트를 표시합니다.
 *
 * @example
 * ```tsx
 * <ExpenseItemList
 *   items={[
 *     { name: "치킨", price: 25000, quantity: 2 },
 *     { name: "피자", price: 20000, quantity: 1 }
 *   ]}
 *   showTotal
 * />
 * ```
 */
export const ExpenseItemList: React.FC<ExpenseItemListProps> = ({
  items,
  showTotal = false,
}) => {
  /**
   * 총 금액 계산
   */
  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>세부 항목이 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 항목 리스트 */}
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.itemRow,
            index < items.length - 1 && styles.itemRowBorder,
          ]}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          </View>
          <Text style={styles.itemPrice}>
            {(item.price * item.quantity).toLocaleString()}원
          </Text>
        </View>
      ))}

      {/* 합계 */}
      {showTotal && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>합계</Text>
          <Text style={styles.totalAmount}>
            {calculateTotal().toLocaleString()}원
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 13,
    color: COLORS.text.tertiary,
  },
  itemPrice: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '600',
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
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
