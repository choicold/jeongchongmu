import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useAuth } from '../../context/AuthContext';
import * as authApi from '../../services/api/authApi';
import { validateEmail } from '../../utils/validation';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * LoginScreen - 로그인 화면
 *
 * 사용자가 이메일과 비밀번호로 로그인할 수 있습니다.
 * 로그인 성공 시 AuthContext의 login() 호출하여 자동으로 MainNavigator로 이동합니다.
 */
export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // AuthContext
  const { login } = useAuth();

  /**
   * 입력값 검증
   */
  const validateInputs = (): boolean => {
    let isValid = true;

    // 이메일 검증
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      isValid = false;
    } else {
      setEmailError('');
    }

    // 비밀번호 검증
    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  /**
   * 로그인 처리
   */
  const handleLogin = async () => {
    // 에러 초기화
    setError('');

    // 입력값 검증
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      // API 호출
      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      // 로그인 응답에서 사용자 정보 추출
      const userData = {
        id: response.id,
        email: response.email,
        name: response.name,
        bankName: response.bankName,
        accountNumber: response.accountNumber,
      };

      // AuthContext의 login() 호출 (토큰 저장 및 상태 업데이트)
      await login(response.bearerToken, userData);

      // 로그인 성공 시 자동으로 MainNavigator로 이동됨 (AppNavigator에서 처리)
    } catch (err: any) {
      console.error('로그인 에러:', err);
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 회원가입 화면으로 이동
   */
  const goToSignUp = () => {
    navigation.navigate(ROUTES.AUTH.SIGN_UP);
  };

  /**
   * Enter 키로 로그인
   */
  const handlePasswordSubmit = () => {
    handleLogin();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 - 로고 영역 */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons
                name="receipt-text"
                size={40}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.title}>정총무</Text>
            <Text style={styles.subtitle}>깔끔한 모임 정산의 시작</Text>
          </View>

          {/* 로그인 폼 */}
          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
                setError('');
              }}
              placeholder="이메일 주소"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
              leftIcon={
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              }
            />

            <Input
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
                setError('');
              }}
              placeholder="비밀번호"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              error={passwordError}
              returnKeyType="done"
              onSubmitEditing={handlePasswordSubmit}
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              }
            />

            {/* 에러 메시지 */}
            {error && (
              <View style={styles.errorContainer}>
                <ErrorMessage
                  message={error}
                  showIcon={true}
                />
              </View>
            )}

            {/* 로그인 버튼 */}
            <Button
              title="로그인"
              onPress={handleLogin}
              variant="primary"
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />

            {/* 구분선 */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 회원가입 버튼 */}
            <Button
              title="회원가입"
              onPress={goToSignUp}
              variant="secondary"
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#D1FAE5', // Emerald 100
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
});
