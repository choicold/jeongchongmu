import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveToken, getToken, removeToken } from '../utils/storage';
import * as authApi from '../services/api/authApi';
import { UpdateProfileRequest } from '../types/auth.types';
import {
  registerForPushNotificationsAsync,
  deleteTokenFromServer,
  setupNotificationHandler
} from '../services/NotificationPermissionService';

/**
 * 사용자 정보 타입
 */
export interface User {
  id: number;
  email: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
}

/**
 * AuthContext 타입 정의
 */
interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user?: User) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
}

/**
 * AuthContext 생성
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider 컴포넌트
 * 앱 전체에서 인증 상태를 관리합니다.
 *
 * @example
 * ```tsx
 * // App.tsx
 * import { AuthProvider } from './context/AuthContext';
 *
 * export default function App() {
 *   return (
 *     <AuthProvider>
 *       <Navigation />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * AsyncStorage에서 토큰을 로드합니다.
   * 앱 시작 시 자동으로 호출됩니다.
   */
  const loadToken = async () => {
    try {
      setIsLoading(true);
      const storedToken = await getToken();

      if (!storedToken) {
        // 토큰이 없으면 로그인 화면으로 이동
        setToken(null);
        setUser(null);
        return;
      }

      // 토큰이 있으면 사용자 정보 조회
      setToken(storedToken);

      try {
        console.log('🔄 프로필 조회 중...');
        const userInfo = await authApi.getUserProfile();
        console.log('✅ 프로필 조회 성공');

        setUser({
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          bankName: userInfo.bankName,
          accountNumber: userInfo.accountNumber,
        });
      } catch (profileError: any) {
        // 401 Unauthorized 또는 기타 에러 시 토큰 무효화
        console.error('❌ 프로필 조회 실패:', profileError.message);
        console.warn('⚠️  토큰을 삭제하고 로그인 화면으로 이동합니다.');

        await removeToken();
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('토큰 로드 실패:', error);
      // 토큰 로드 실패 시 초기화
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그인 처리
   * 토큰을 AsyncStorage에 저장하고 상태를 업데이트합니다.
   * 로그인 성공 후 FCM 토큰을 등록합니다.
   *
   * @param token - JWT 토큰
   * @param user - 사용자 정보 (선택적)
   *
   * @example
   * ```tsx
   * const { login } = useAuth();
   *
   * const handleLogin = async () => {
   *   const response = await authApi.login({ email, password });
   *   await login(response.bearerToken);
   * };
   * ```
   */
  const login = async (newToken: string, userData?: User) => {
    try {
      // AsyncStorage에 토큰 저장
      await saveToken(newToken);

      // 상태 업데이트
      setToken(newToken);

      if (userData) {
        setUser(userData);
      } else {
        // 토큰으로 사용자 정보 조회
        try {
          const userInfo = await authApi.getUserProfile();
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            bankName: userInfo.bankName,
            accountNumber: userInfo.accountNumber,
          });
        } catch (profileError) {
          console.warn('⚠️ 프로필 조회 실패:', profileError);
          // 프로필 조회 실패 시에도 로그인은 유지
          setUser(null);
        }
      }

      console.log('✅ 로그인 성공');

      // FCM 토큰 등록 (비동기, 실패해도 로그인은 유지)
      try {
        await registerForPushNotificationsAsync();
        console.log('✅ FCM 토큰 등록 완료');
      } catch (fcmError) {
        console.warn('⚠️ FCM 토큰 등록 실패:', fcmError);
        // FCM 토큰 등록 실패해도 로그인은 정상 진행
      }
    } catch (error) {
      console.error('❌ 로그인 처리 실패:', error);
      throw error;
    }
  };

  /**
   * 로그아웃 처리
   * 서버에 로그아웃을 요청하고 토큰을 삭제하여 상태를 초기화합니다.
   * 서버에서 FCM 토큰을 삭제합니다.
   *
   * @example
   * ```tsx
   * const { logout } = useAuth();
   *
   * const handleLogout = async () => {
   *   await logout();
   *   navigation.navigate('Login');
   * };
   * ```
   */
  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (FCM 토큰 삭제 포함)
      try {
        await authApi.logout();
        console.log('✅ 서버 로그아웃 완료 (FCM 토큰 삭제됨)');
      } catch (apiError) {
        console.warn('⚠️ 서버 로그아웃 실패:', apiError);
        // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      }

      // AsyncStorage에서 토큰 삭제
      await removeToken();

      // 상태 초기화
      setToken(null);
      setUser(null);

      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      throw error;
    }
  };

  /**
   * 프로필 업데이트
   * 현재 로그인한 사용자의 프로필 정보를 수정합니다.
   *
   * @param data - 프로필 수정 데이터 (name, bankName, accountNumber)
   *
   * @example
   * ```tsx
   * const { updateProfile } = useAuth();
   *
   * const handleUpdateProfile = async () => {
   *   await updateProfile({
   *     name: "홍길동",
   *     bankName: "국민은행",
   *     accountNumber: "123456789"
   *   });
   * };
   * ```
   */
  const updateProfile = async (data: UpdateProfileRequest) => {
    try {
      const updatedProfile = await authApi.updateUserProfile(data);

      // 사용자 정보 업데이트
      setUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        bankName: updatedProfile.bankName,
        accountNumber: updatedProfile.accountNumber,
      });

      console.log('프로필 업데이트 성공');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  };

  /**
   * 앱 시작 시 토큰 로드 및 알림 핸들러 설정
   */
  useEffect(() => {
    // 알림 핸들러 설정 (앱 시작 시 한 번만)
    setupNotificationHandler();

    // 토큰 로드
    loadToken();
  }, []);

  const value: AuthContextType = {
    token,
    user,
    isLoading,
    login,
    logout,
    loadToken,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth 훅
 * AuthContext에 접근하기 위한 커스텀 훅입니다.
 *
 * @returns AuthContextType - 인증 상태 및 함수
 * @throws {Error} Provider 외부에서 사용 시 에러 발생
 *
 * @example
 * ```tsx
 * import { useAuth } from '../context/AuthContext';
 *
 * function LoginScreen() {
 *   const { login, isLoading } = useAuth();
 *
 *   const handleLogin = async () => {
 *     const response = await authApi.login({ email, password });
 *     await login(response.bearerToken);
 *   };
 *
 *   return <Button onPress={handleLogin} loading={isLoading} />;
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * 인증 여부를 확인하는 헬퍼 함수
 * token이 있으면 인증된 것으로 간주합니다.
 *
 * @example
 * ```tsx
 * const { token } = useAuth();
 * const isAuthenticated = !!token;
 *
 * if (isAuthenticated) {
 *   return <MainNavigator />;
 * } else {
 *   return <AuthNavigator />;
 * }
 * ```
 */
export const useIsAuthenticated = (): boolean => {
  const { token } = useAuth();
  return !!token;
};
