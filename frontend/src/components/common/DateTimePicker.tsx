import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { COLORS } from '../../constants/colors';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  visible: boolean;
  onClose: () => void;
}

/**
 * DateTimePicker - 커스텀 날짜/시간 선택기
 *
 * 앱 UI와 통일된 디자인의 한글 날짜/시간 선택기
 */
export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  visible,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState(value);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [year, setYear] = useState(selectedDate.getFullYear());
  const [month, setMonth] = useState(selectedDate.getMonth());
  const [day, setDay] = useState(selectedDate.getDate());
  const [hour, setHour] = useState(selectedDate.getHours());
  const [minute, setMinute] = useState(selectedDate.getMinutes());

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const handleConfirm = () => {
    const newDate = new Date(year, month, day, hour, minute);
    onChange(newDate);
    onClose();
  };

  const renderPicker = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    formatter: (value: number) => string
  ) => {
    return (
      <ScrollView
        style={styles.pickerColumn}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pickerContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.pickerItem,
              selectedValue === item && styles.pickerItemSelected,
            ]}
            onPress={() => onValueChange(item)}
          >
            <Text
              style={[
                styles.pickerItemText,
                selectedValue === item && styles.pickerItemTextSelected,
              ]}
            >
              {formatter(item)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>날짜 및 시간 선택</Text>
          </View>

          <View style={styles.pickersContainer}>
            {/* 년 */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>년</Text>
              {renderPicker(years, year, setYear, (v) => `${v}`)}
            </View>

            {/* 월 */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>월</Text>
              {renderPicker(
                months,
                month,
                setMonth,
                (v) => monthNames[v].replace('월', '')
              )}
            </View>

            {/* 일 */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>일</Text>
              {renderPicker(days, day, setDay, (v) => `${v}`)}
            </View>

            {/* 시 */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>시</Text>
              {renderPicker(hours, hour, setHour, (v) => `${v}`)}
            </View>

            {/* 분 */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>분</Text>
              {renderPicker(minutes, minute, setMinute, (v) => `${v.toString().padStart(2, '0')}`)}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  pickersContainer: {
    flexDirection: 'row',
    height: 200,
    paddingVertical: 16,
  },
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerContent: {
    paddingHorizontal: 4,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary,
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
