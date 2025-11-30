import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Button } from './Button';

/**
 * ErrorMessage Props 타입 정의
 */
export interface ErrorMessageProps {
  /** 에러 메시지 */
  message: string;
  /** 재시도 버튼 표시 여부 */
  showRetry?: boolean;
  /** 재시도 버튼 클릭 핸들러 */
  onRetry?: () => void;
  /** 에러 아이콘 표시 여부 */
  showIcon?: boolean;
  /** 전체 화면 중앙 정렬 여부 */
  fullScreen?: boolean;
  /** 커스텀 컨테이너 스타일 */
  style?: ViewStyle;
}

/**
 * ErrorMessage 컴포넌트
 * 에러 메시지를 표시하는 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * // 기본 에러 메시지
 * <ErrorMessage message="데이터를 불러오는데 실패했습니다." />
 *
 * // 재시도 버튼 포함
 * <ErrorMessage
 *   message="네트워크 오류가 발생했습니다."
 *   showRetry
 *   onRetry={handleRetry}
 * />
 *
 * // 전체 화면 에러
 * <ErrorMessage
 *   message="알 수 없는 오류가 발생했습니다."
 *   fullScreen
 *   showRetry
 *   onRetry={handleRetry}
 * />
 * ```
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  showRetry = false,
  onRetry,
  showIcon = true,
  fullScreen = false,
  style,
}) => {
  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ];

  return (
    <View style={containerStyle}>
      {showIcon && (
        <Ionicons
          name="alert-circle"
          size={24}
          color={COLORS.error}
          style={styles.icon}
        />
      )}
      <Text style={styles.message}>{message}</Text>
      {showRetry && onRetry && (
        <Button
          title="다시 시도"
          onPress={onRetry}
          variant="primary"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background.default,
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 8,
    minWidth: 120,
  },
});
