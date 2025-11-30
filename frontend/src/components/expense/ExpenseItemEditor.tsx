import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExpenseItemDTO } from '../../types/expense.types';
import { COLORS } from '../../constants/colors';
import { Card } from '../common/Card';

/**
 * ExpenseItemEditor Props 타입 정의
 */
export interface ExpenseItemEditorProps {
  /** 지출 세부 항목 리스트 */
  items: ExpenseItemDTO[];
  /** 항목 변경 콜백 */
  onItemsChange: (items: ExpenseItemDTO[]) => void;
  /** 합계 표시 여부 */
  showTotal?: boolean;
}

/**
 * ExpenseItemEditor 컴포넌트
 * 지출의 세부 항목(품목)을 추가/수정/삭제할 수 있습니다.
 */
export const ExpenseItemEditor: React.FC<ExpenseItemEditorProps> = ({
  items,
  onItemsChange,
  showTotal = true,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ExpenseItemDTO | null>(null);
  const [newItem, setNewItem] = useState<ExpenseItemDTO>({
    name: '',
    price: 0,
    quantity: 0,
  });
  const [isAdding, setIsAdding] = useState(false);

  /**
   * 총 금액 계산
   */
  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  /**
   * 항목 추가
   */
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      Alert.alert('알림', '항목 이름을 입력해주세요.');
      return;
    }
    if (newItem.price <= 0) {
      Alert.alert('알림', '올바른 가격을 입력해주세요.');
      return;
    }

    // 수량이 0이거나 입력되지 않은 경우 기본값 1로 설정
    const finalQuantity = newItem.quantity <= 0 ? 1 : newItem.quantity;

    onItemsChange([...items, { ...newItem, quantity: finalQuantity }]);
    setNewItem({ name: '', price: 0, quantity: 0 });
    setIsAdding(false);
  };

  /**
   * 편집 시작
   */
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  /**
   * 편집 취소
   */
  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingItem(null);
  };

  /**
   * 항목 수정 완료
   */
  const handleUpdateItem = () => {
    if (editingIndex === null || !editingItem) return;

    if (!editingItem.name.trim()) {
      Alert.alert('알림', '항목 이름을 입력해주세요.');
      return;
    }
    if (editingItem.price <= 0) {
      Alert.alert('알림', '올바른 가격을 입력해주세요.');
      return;
    }
    if (editingItem.quantity <= 0) {
      Alert.alert('알림', '올바른 수량을 입력해주세요.');
      return;
    }

    const newItems = [...items];
    newItems[editingIndex] = editingItem;
    onItemsChange(newItems);
    setEditingIndex(null);
    setEditingItem(null);
  };

  /**
   * 항목 삭제
   */
  const handleDeleteItem = (index: number) => {
    Alert.alert('삭제 확인', '이 항목을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const newItems = items.filter((_, i) => i !== index);
          onItemsChange(newItems);
        },
      },
    ]);
  };

  /**
   * 항목 행 렌더링
   */
  const renderItem = (item: ExpenseItemDTO, index: number) => {
    const isEditing = editingIndex === index;

    if (isEditing && editingItem) {
      return (
        <View key={index} style={styles.editingContainer}>
          <View style={styles.editingRow}>
            <View style={styles.editingItemInputWrapper}>
              <TextInput
                style={styles.editingItemInput}
                value={editingItem.name}
                onChangeText={(text) =>
                  setEditingItem({ ...editingItem, name: text })
                }
                placeholder="항목명"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
            <View style={styles.editingPriceInputWrapper}>
              <TextInput
                style={styles.editingPriceInput}
                value={editingItem.price > 0 ? editingItem.price.toString() : ''}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9]/g, '');
                  const price = cleanText === '' ? 0 : parseInt(cleanText, 10);
                  setEditingItem({ ...editingItem, price });
                }}
                keyboardType="numeric"
                placeholder="가격"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
            <View style={styles.editingQuantityInputWrapper}>
              <TextInput
                style={styles.editingQuantityInput}
                value={editingItem.quantity > 0 ? editingItem.quantity.toString() : ''}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9]/g, '');
                  const quantity = cleanText === '' ? 0 : parseInt(cleanText, 10);
                  setEditingItem({ ...editingItem, quantity });
                }}
                keyboardType="numeric"
                placeholder="수량"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
            <TouchableOpacity
              onPress={handleUpdateItem}
              style={styles.iconButton}
            >
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={index} style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetail}>
            {item.price.toLocaleString()}원 x {item.quantity}
          </Text>
        </View>
        <Text style={styles.itemPrice}>
          {(item.price * item.quantity).toLocaleString()}원
        </Text>
        <TouchableOpacity
          onPress={() => startEditing(index)}
          style={styles.iconButton}
        >
          <Ionicons name="pencil" size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteItem(index)}
          style={styles.iconButton}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.system.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 항목 리스트 */}
      {items.map((item, index) => renderItem(item, index))}

      {/* 새 항목 추가 폼 */}
      {isAdding ? (
        <Card style={styles.addingCard}>
          <View style={styles.itemInputWrapper}>
            <TextInput
              style={styles.itemInput}
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              placeholder="항목명 (예: 치킨)"
              placeholderTextColor={COLORS.text.tertiary}
              autoFocus
            />
          </View>
          <View style={styles.addingRow}>
            <View style={styles.priceInputWrapper}>
              <TextInput
                style={styles.priceInput}
                value={newItem.price > 0 ? newItem.price.toString() : ''}
                onChangeText={(text) => {
                  const price = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                  setNewItem({ ...newItem, price });
                }}
                keyboardType="numeric"
                placeholder="가격 (예: 20000)"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
            <View style={styles.quantityInputWrapper}>
              <TextInput
                style={styles.quantityInput}
                value={newItem.quantity > 0 ? newItem.quantity.toString() : ''}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9]/g, '');
                  const quantity = cleanText === '' ? 0 : parseInt(cleanText, 10);
                  setNewItem({ ...newItem, quantity });
                }}
                keyboardType="numeric"
                placeholder="수량 (예: 2)"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
          </View>
          <View style={styles.addingActions}>
            <TouchableOpacity
              onPress={() => {
                setIsAdding(false);
                setNewItem({ name: '', price: 0, quantity: 0 });
              }}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddItem}
              style={[styles.actionButton, styles.addButton]}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <TouchableOpacity
          onPress={() => setIsAdding(true)}
          style={styles.addItemButton}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addItemText}>항목 추가</Text>
        </TouchableOpacity>
      )}

      {/* 합계 */}
      {showTotal && items.length > 0 && (
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  editingContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  editingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editingItemInputWrapper: {
    flex: 2,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
    height: 44,
  },
  editingItemInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  editingPriceInputWrapper: {
    flex: 2,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
    height: 44,
  },
  editingPriceInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  editingQuantityInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
    height: 44,
  },
  editingQuantityInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 13,
    color: COLORS.text.tertiary,
  },
  itemPrice: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  iconButton: {
    padding: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  addItemText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  addingCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  itemInputWrapper: {
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  addingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  priceInputWrapper: {
    flex: 2,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
  },
  priceInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  quantityInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  addingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
