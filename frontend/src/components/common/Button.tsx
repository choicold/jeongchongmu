import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * Button Props 타입 정의
 */
export interface ButtonProps {
  /** 버튼에 표시될 텍스트 */
  title: string;
  /** 버튼 클릭 시 호출될 함수 */
  onPress: () => void;
  /** 버튼 스타일 variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 로딩 상태 (true일 때 ActivityIndicator 표시) */
  loading?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 커스텀 스타일 */
  style?: ViewStyle;
  /** 커스텀 텍스트 스타일 */
  textStyle?: TextStyle;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
}

/**
 * Button 컴포넌트
 * 재사용 가능한 커스텀 버튼 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * <Button
 *   title="로그인"
 *   onPress={handleLogin}
 *   variant="primary"
 *   loading={isLoading}
 * />
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  // variant에 따른 스타일 선택
  const buttonStyle = [
    styles.button,
    fullWidth && styles.fullWidth,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && styles.danger,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'danger' && styles.textDanger,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    shadowOpacity: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  textPrimary: {
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.text.secondary,
  },
  textDanger: {
    color: COLORS.white,
  },
});
