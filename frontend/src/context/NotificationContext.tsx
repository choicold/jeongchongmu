import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getUnreadCount } from '../services/api/notificationApi';

/**
 * NotificationContext 타입 정의
 */
interface NotificationContextType {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  isLoading: boolean;
}

/**
 * NotificationContext 생성
 */
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

/**
 * NotificationProvider Props
 */
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * NotificationProvider 컴포넌트
 * 앱 전체에서 알림 상태를 관리합니다.
 *
 * @example
 * ```tsx
 * // App.tsx
 * import { NotificationProvider } from './context/NotificationContext';
 *
 * export default function App() {
 *   return (
 *     <AuthProvider>
 *       <NotificationProvider>
 *         <Navigation />
 *       </NotificationProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 서버에서 미읽음 알림 개수를 조회합니다.
   *
   * @example
   * ```tsx
   * const { fetchUnreadCount } = useNotification();
   *
   * useEffect(() => {
   *   fetchUnreadCount(); // 화면 진입 시 미읽음 개수 조회
   * }, []);
   * ```
   */
  const fetchUnreadCount = async () => {
    try {
      setIsLoading(true);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('미읽음 알림 개수 조회 실패:', error);
      // 에러 발생 시 0으로 설정
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 미읽음 알림 개수를 1 증가시킵니다.
   * 새 알림을 수신했을 때 호출합니다.
   *
   * @example
   * ```tsx
   * const { incrementUnreadCount } = useNotification();
   *
   * // 푸시 알림 수신 시
   * messaging().onMessage(async (remoteMessage) => {
   *   console.log('새 알림:', remoteMessage);
   *   incrementUnreadCount();
   * });
   * ```
   */
  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  /**
   * 미읽음 알림 개수를 0으로 초기화합니다.
   * 모든 알림을 읽음 처리했을 때 호출합니다.
   *
   * @example
   * ```tsx
   * const { resetUnreadCount } = useNotification();
   *
   * const handleMarkAllAsRead = async () => {
   *   await notificationApi.markAllAsRead();
   *   resetUnreadCount();
   * };
   * ```
   */
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  const value: NotificationContextType = {
    unreadCount,
    fetchUnreadCount,
    incrementUnreadCount,
    resetUnreadCount,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * useNotification 훅
 * NotificationContext에 접근하기 위한 커스텀 훅입니다.
 *
 * @returns NotificationContextType - 알림 상태 및 함수
 * @throws {Error} Provider 외부에서 사용 시 에러 발생
 *
 * @example
 * ```tsx
 * import { useNotification } from '../context/NotificationContext';
 *
 * function NotificationBadge() {
 *   const { unreadCount, fetchUnreadCount } = useNotification();
 *
 *   useEffect(() => {
 *     fetchUnreadCount();
 *   }, []);
 *
 *   if (unreadCount === 0) return null;
 *
 *   return (
 *     <View style={styles.badge}>
 *       <Text>{unreadCount}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
};

/**
 * 미읽음 알림이 있는지 확인하는 헬퍼 함수
 *
 * @example
 * ```tsx
 * const { unreadCount } = useNotification();
 * const hasUnread = unreadCount > 0;
 *
 * return (
 *   <TabBarIcon
 *     name="notifications"
 *     badge={hasUnread ? unreadCount : undefined}
 *   />
 * );
 * ```
 */
export const useHasUnreadNotifications = (): boolean => {
  const { unreadCount } = useNotification();
  return unreadCount > 0;
};
