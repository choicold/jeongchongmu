import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * LoadingSpinner Props 타입 정의
 */
export interface LoadingSpinnerProps {
  /** 로딩 스피너 크기 */
  size?: 'small' | 'large';
  /** 로딩 스피너 색상 */
  color?: string;
  /** 로딩 메시지 */
  message?: string;
  /** 전체 화면 중앙 정렬 여부 */
  fullScreen?: boolean;
  /** 커스텀 컨테이너 스타일 */
  style?: ViewStyle;
}

/**
 * LoadingSpinner 컴포넌트
 * 재사용 가능한 로딩 인디케이터 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * // 기본 로딩
 * <LoadingSpinner />
 *
 * // 메시지 포함
 * <LoadingSpinner message="데이터를 불러오는 중..." />
 *
 * // 전체 화면 로딩
 * <LoadingSpinner fullScreen message="잠시만 기다려주세요" />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = COLORS.primary,
  message,
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
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
