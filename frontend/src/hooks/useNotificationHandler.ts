import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotification } from '../context/NotificationContext';

/**
 * 푸시 알림 타입 정의 (백엔드 NotificationType과 동일)
 */
type NotificationType =
  | 'SETTLEMENT_CREATED'
  | 'VOTE_STARTED'
  | 'VOTE_COMPLETED'
  | 'SETTLEMENT_COMPLETED';

/**
 * 알림 데이터 페이로드 타입
 */
interface NotificationData {
  type: NotificationType;
  screenType: string;
  targetId: string;
}

/**
 * 푸시 알림 수신 및 딥링킹 처리 Hook
 *
 * 이 Hook은 푸시 알림을 수신하고, 사용자가 알림을 탭했을 때
 * 적절한 화면으로 이동시키는 역할을 합니다.
 *
 * @example
 * ```typescript
 * // App.tsx 또는 AppNavigator.tsx에서 사용
 * function App() {
 *   useNotificationHandler();
 *   return <AppNavigator />;
 * }
 * ```
 */
export function useNotificationHandler() {
  const navigation = useNavigation<any>();
  const { incrementUnreadCount } = useNotification();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // 1. 앱이 포그라운드에 있을 때 알림을 수신하는 리스너
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 알림 수신:', notification);

        // 미읽음 개수 증가
        incrementUnreadCount();

        // 알림 내용 로그
        const { title, body } = notification.request.content;
        console.log(`제목: ${title}, 내용: ${body}`);
      }
    );

    // 2. 사용자가 알림을 탭했을 때의 리스너 (딥링킹)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('🔔 알림 탭됨:', response);

        const data = response.notification.request.content.data as NotificationData;

        // 딥링킹 처리
        handleNotificationNavigation(data);
      }
    );

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      // Expo Go 호환성: SDK 53부터 removeNotificationSubscription이 제거됨
      if (notificationListener.current) {
        if (Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
      }
      if (responseListener.current) {
        if (Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      }
    };
  }, [navigation, incrementUnreadCount]);

  /**
   * 알림 타입에 따라 적절한 화면으로 이동
   *
   * @param data - 알림 데이터 페이로드
   */
  const handleNotificationNavigation = (data: NotificationData) => {
    if (!data || !data.type || !data.targetId) {
      console.warn('⚠️ 알림 데이터가 올바르지 않습니다:', data);
      return;
    }

    const { type, screenType, targetId } = data;
    const targetIdNumber = parseInt(targetId, 10);

    console.log(`🚀 딥링킹 - 타입: ${type}, 화면: ${screenType}, ID: ${targetIdNumber}`);

    try {
      switch (type) {
        case 'SETTLEMENT_CREATED':
          // 정산 생성 알림 -> 정산 상세 화면으로 이동
          navigation.navigate('MainTab', {
            screen: 'Main',
            params: {
              screen: 'SettlementDetail',
              params: { settlementId: targetIdNumber },
            },
          });
          break;

        case 'VOTE_STARTED':
          // 투표 시작 알림 -> 투표 화면으로 이동
          navigation.navigate('MainTab', {
            screen: 'Main',
            params: {
              screen: 'Vote',
              params: { expenseId: targetIdNumber },
            },
          });
          break;

        case 'VOTE_COMPLETED':
          // 투표 완료 알림 -> 정산 결과 화면으로 이동
          // targetId는 expenseId이므로, 해당 expense의 settlement를 조회해야 함
          // 여기서는 ExpenseDetail로 이동하거나, 별도 API 호출 후 SettlementDetail로 이동
          navigation.navigate('MainTab', {
            screen: 'Main',
            params: {
              screen: 'ExpenseDetail',
              params: { expenseId: targetIdNumber },
            },
          });
          break;

        case 'SETTLEMENT_COMPLETED':
          // 정산 완료 알림 -> 정산 상세 화면으로 이동
          navigation.navigate('MainTab', {
            screen: 'Main',
            params: {
              screen: 'SettlementDetail',
              params: { settlementId: targetIdNumber },
            },
          });
          break;

        default:
          console.warn('⚠️ 알 수 없는 알림 타입:', type);
          // 기본적으로 알림 탭으로 이동
          navigation.navigate('NotificationsTab');
      }
    } catch (error) {
      console.error('❌ 딥링킹 처리 중 오류 발생:', error);
      // 오류 발생 시 홈 화면으로 이동
      navigation.navigate('MainTab');
    }
  };
}
