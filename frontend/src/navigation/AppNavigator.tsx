import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNotificationHandler } from '../hooks/useNotificationHandler';

/**
 * 로딩 화면 컴포넌트
 */
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

/**
 * NavigationContent - NavigationContainer 내부 컴포넌트
 * 푸시 알림 핸들러 설정 및 인증 상태에 따라 네비게이터를 렌더링합니다.
 */
const NavigationContent: React.FC = () => {
  const { token } = useAuth();
  const { fetchUnreadCount } = useNotification();

  // 푸시 알림 핸들러 설정 (NavigationContainer 안쪽에서 호출)
  useNotificationHandler();

  /**
   * 로그인 시 알림 개수 조회
   */
  useEffect(() => {
    if (token) {
      fetchUnreadCount();
    }
  }, [token]);

  return <>{token ? <MainNavigator /> : <AuthNavigator />}</>;
};

/**
 * AppNavigator - 루트 네비게이터
 * 인증 상태에 따라 AuthNavigator 또는 MainNavigator를 렌더링합니다.
 *
 * @example
 * ```tsx
 * // App.tsx
 * import { AppNavigator } from './navigation/AppNavigator';
 * import { AuthProvider } from './context/AuthContext';
 * import { NotificationProvider } from './context/NotificationContext';
 *
 * export default function App() {
 *   return (
 *     <AuthProvider>
 *       <NotificationProvider>
 *         <AppNavigator />
 *       </NotificationProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AppNavigator: React.FC = () => {
  const { isLoading } = useAuth();

  /**
   * 토큰 로딩 중일 때 로딩 화면 표시
   */
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <NavigationContent />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
