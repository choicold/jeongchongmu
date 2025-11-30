import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';

/**
 * AuthNavigator ParamList 타입 정의
 */
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator - 인증 관련 스택 네비게이터
 * 로그인하지 않은 사용자에게 표시됩니다.
 *
 * @example
 * ```tsx
 * // 화면에서 네비게이션 사용
 * import { NativeStackScreenProps } from '@react-navigation/native-stack';
 * import { AuthStackParamList } from '../navigation/AuthNavigator';
 *
 * type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
 *
 * function LoginScreen({ navigation }: Props) {
 *   const goToSignUp = () => navigation.navigate('SignUp');
 *   // ...
 * }
 * ```
 */
export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // 헤더 숨김 (커스텀 헤더 사용 가능)
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: '로그인',
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{
          title: '회원가입',
          headerShown: true, // 회원가입은 뒤로가기 버튼 표시
          headerBackTitle: '뒤로',
        }}
      />
    </Stack.Navigator>
  );
};
