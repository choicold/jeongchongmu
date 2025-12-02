import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from './api/apiClient';

/**
 * 푸시 알림 권한 및 FCM 토큰 관리 서비스
 *
 * 이 서비스는 Expo의 푸시 알림 기능을 사용하여 FCM 토큰을 관리합니다.
 *
 * @author Jeongchongmu Team
 */

/**
 * 푸시 알림 권한 요청 및 FCM 토큰 등록
 *
 * @returns Promise<string | null> - FCM 토큰 또는 null
 *
 * @example
 * ```typescript
 * const token = await registerForPushNotificationsAsync();
 * if (token) {
 *   console.log('FCM 토큰:', token);
 * }
 * ```
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // 실제 기기인지 확인 (에뮬레이터/시뮬레이터에서는 푸시 알림 불가)
  if (!Device.isDevice) {
    console.warn('⚠️ 푸시 알림은 실제 기기에서만 작동합니다.');
    return null;
  }

  try {
    // 현재 권한 상태 확인
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 권한이 거부되었으면 종료
    if (finalStatus !== 'granted') {
      console.warn('⚠️ 푸시 알림 권한이 거부되었습니다.');
      return null;
    }

    // Expo Push Token 가져오기 (FCM 토큰)
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
    });

    token = pushToken.data;
    console.log('✅ FCM 토큰 발급 성공:', token);

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    // 서버에 FCM 토큰 전송
    if (token) {
      await sendTokenToServer(token);
    }

    return token;
  } catch (error) {
    console.error('❌ FCM 토큰 등록 실패:', error);
    return null;
  }
}

/**
 * 서버에 FCM 토큰 전송
 *
 * @param fcmToken - FCM 토큰
 * @returns Promise<void>
 */
async function sendTokenToServer(fcmToken: string): Promise<void> {
  try {
    await apiClient.post('/api/user/fcm-token', { fcmToken });
    console.log('✅ 서버에 FCM 토큰 전송 성공');
  } catch (error: any) {
    console.error('❌ 서버에 FCM 토큰 전송 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 서버에서 FCM 토큰 삭제 (로그아웃 시 호출)
 *
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await deleteTokenFromServer();
 * ```
 */
export async function deleteTokenFromServer(): Promise<void> {
  try {
    await apiClient.delete('/api/user/fcm-token');
    console.log('✅ 서버에서 FCM 토큰 삭제 성공');
  } catch (error: any) {
    console.error('❌ 서버에서 FCM 토큰 삭제 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 알림 핸들러 설정
 * 앱이 포그라운드에 있을 때 알림을 어떻게 표시할지 결정합니다.
 *
 * @example
 * ```typescript
 * // App.tsx에서 호출
 * setupNotificationHandler();
 * ```
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,  // 알림을 화면에 표시
      shouldPlaySound: true,  // 알림 소리 재생
      shouldSetBadge: true,   // 앱 아이콘 배지 설정
      shouldShowBanner: true, // 상단 배너 알림
      shouldShowList: true,   // 알림 센터 목록
    }),
  });
}
