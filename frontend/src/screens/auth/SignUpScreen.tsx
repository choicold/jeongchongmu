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
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as authApi from '../../services/api/authApi';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateAccountNumber,
  validateBankName,
} from '../../utils/validation';
import { COLORS } from '../../constants/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

/**
 * SignUpScreen - 회원가입 화면
 *
 * 신규 사용자가 계정을 생성할 수 있습니다.
 * 이메일, 비밀번호, 이름, 은행명, 계좌번호를 입력받아 회원가입을 진행합니다.
 */
export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [nameError, setNameError] = useState('');
  const [bankNameError, setBankNameError] = useState('');
  const [accountNumberError, setAccountNumberError] = useState('');

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
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || '비밀번호를 확인해주세요.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    // 비밀번호 확인 검증
    if (!passwordConfirm) {
      setPasswordConfirmError('비밀번호를 다시 입력해주세요.');
      isValid = false;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
      isValid = false;
    } else {
      setPasswordConfirmError('');
    }

    // 이름 검증
    if (!name.trim()) {
      setNameError('이름을 입력해주세요.');
      isValid = false;
    } else if (!validateName(name)) {
      setNameError('이름은 2~20자 사이여야 합니다.');
      isValid = false;
    } else {
      setNameError('');
    }

    // 은행명 검증
    if (!bankName.trim()) {
      setBankNameError('은행명을 입력해주세요.');
      isValid = false;
    } else if (!validateBankName(bankName)) {
      setBankNameError('올바른 은행명을 입력해주세요. (예: 국민은행, KB뱅크)');
      isValid = false;
    } else {
      setBankNameError('');
    }

    // 계좌번호 검증
    if (!accountNumber.trim()) {
      setAccountNumberError('계좌번호를 입력해주세요.');
      isValid = false;
    } else if (!validateAccountNumber(accountNumber)) {
      setAccountNumberError('올바른 계좌번호를 입력해주세요. (10~20자리 숫자)');
      isValid = false;
    } else {
      setAccountNumberError('');
    }

    return isValid;
  };

  /**
   * 회원가입 처리
   */
  const handleSignUp = async () => {
    // 에러 초기화
    setError('');

    // 입력값 검증
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      // API 호출
      const message = await authApi.signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      });

      // 회원가입 성공
      Alert.alert(
        '회원가입 완료',
        message || '회원가입이 완료되었습니다. 로그인해주세요.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(), // 로그인 화면으로 돌아가기
          },
        ]
      );
    } catch (err: any) {
      console.error('회원가입 에러:', err);
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그인 화면으로 이동
   */
  const goToLogin = () => {
    navigation.goBack();
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
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>환영합니다! 👋</Text>
            <Text style={styles.subtitle}>
              정총무와 함께 똑똑한 지출 관리를 시작하세요.
            </Text>
          </View>

          {/* 회원가입 폼 */}
          <View style={styles.form}>
            {/* 이름 */}
            <Input
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError('');
                setError('');
              }}
              placeholder="이름 (닉네임)"
              autoComplete="name"
              error={nameError}
              leftIcon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              }
            />

            {/* 이메일 */}
            <Input
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
                setError('');
              }}
              placeholder="이메일"
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

            {/* 비밀번호 */}
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
              autoComplete="off"
              textContentType="none"
              error={passwordError}
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              }
            />

            {/* 비밀번호 확인 */}
            <Input
              value={passwordConfirm}
              onChangeText={(text) => {
                setPasswordConfirm(text);
                setPasswordConfirmError('');
                setError('');
              }}
              placeholder="비밀번호 확인"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
              error={passwordConfirmError}
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              }
            />

            {/* 은행명 */}
            <Input
              value={bankName}
              onChangeText={(text) => {
                setBankName(text);
                setBankNameError('');
                setError('');
              }}
              placeholder="은행명 (예: 국민은행, KB뱅크)"
              error={bankNameError}
              leftIcon={
                <MaterialCommunityIcons
                  name="bank-outline"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              }
            />

            {/* 계좌번호 */}
            <Input
              value={accountNumber}
              onChangeText={(text) => {
                // 붙여넣기 시 공백 제거 및 하이픈만 허용
                const cleaned = text.replace(/[^\d-]/g, '');
                setAccountNumber(cleaned);
                setAccountNumberError('');
                setError('');
              }}
              placeholder="계좌번호 (붙여넣기 가능)"
              keyboardType="numbers-and-punctuation"
              autoComplete="off"
              textContentType="none"
              error={accountNumberError}
              leftIcon={
                <MaterialCommunityIcons
                  name="credit-card-outline"
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
                  showIcon={false}
                  style={styles.error}
                />
              </View>
            )}

            {/* 회원가입 버튼 */}
            <Button
              title="가입하기"
              onPress={handleSignUp}
              variant="primary"
              loading={loading}
              disabled={loading}
              style={styles.signupButton}
            />

            {/* 로그인 링크 */}
            <TouchableOpacity
              onPress={goToLogin}
              disabled={loading}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>
                이미 계정이 있으신가요? <Text style={styles.loginLink}>로그인</Text>
              </Text>
            </TouchableOpacity>
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
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    marginBottom: 16,
  },
  error: {
    padding: 0,
  },
  signupButton: {
    marginTop: 8,
  },
  loginButton: {
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  loginLink: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});
