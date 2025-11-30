import React, { useState, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * Input Props 타입 정의
 */
export interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  /** 입력 필드 레이블 */
  label?: string;
  /** 입력 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChangeText: (text: string) => void;
  /** Placeholder 텍스트 */
  placeholder?: string;
  /** 비밀번호 입력 여부 */
  secureTextEntry?: boolean;
  /** 키보드 타입 */
  keyboardType?: TextInputProps['keyboardType'];
  /** 에러 메시지 */
  error?: string;
  /** 필수 입력 여부 표시 */
  required?: boolean;
  /** 커스텀 컨테이너 스타일 */
  containerStyle?: ViewStyle;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 왼쪽 아이콘 */
  leftIcon?: ReactNode;
}

/**
 * Input 컴포넌트
 * 재사용 가능한 텍스트 입력 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * <Input
 *   label="이메일"
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="example@email.com"
 *   keyboardType="email-address"
 *   error={emailError}
 *   required
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  required = false,
  containerStyle,
  disabled = false,
  leftIcon,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Field with Icon */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithIcon : undefined,
            disabled ? styles.inputDisabled : undefined,
            secureTextEntry ? styles.secureTextInput : undefined,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.input,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 12,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: COLORS.border.focus,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.background.secondary,
  },
  iconContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputDisabled: {
    color: COLORS.text.disabled,
  },
  secureTextInput: {
    // secureTextEntry 사용 시 텍스트(점) 색상을 명시적으로 검은색으로 설정
    color: COLORS.text.primary,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});
