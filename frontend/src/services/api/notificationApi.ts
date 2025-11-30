import apiClient from './apiClient';
import { NotificationDto } from '../../types/notification.types';

/**
 * 현재 사용자의 알림 목록을 조회합니다.
 * 정산 요청, 투표 생성, 지출 추가 등의 알림을 확인할 수 있습니다.
 *
 * @returns Promise<NotificationDto[]> - 알림 목록 배열
 *
 * @throws {Error} 알림 목록 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const notifications = await getNotifications();
 *   const unreadCount = notifications.filter(n => !n.isRead).length;
 *   console.log("미읽음 알림:", unreadCount);
 * } catch (error) {
 *   console.error("알림 조회 실패:", error);
 * }
 * ```
 */
export const getNotifications = async (): Promise<NotificationDto[]> => {
  try {
    const response = await apiClient.get<NotificationDto[]>('/api/notifications');
    return response.data;
  } catch (error: any) {
    console.error('알림 목록 조회 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '알림 목록 조회에 실패했습니다.'
    );
  }
};

/**
 * 특정 알림을 읽음 처리합니다.
 *
 * @param notificationId - 읽음 처리할 알림 ID
 * @returns Promise<void>
 *
 * @throws {Error} 알림 읽음 처리 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await markAsRead(5);
 *   console.log("알림을 읽음 처리했습니다.");
 * } catch (error) {
 *   console.error("알림 읽음 처리 실패:", error);
 * }
 * ```
 */
export const markAsRead = async (notificationId: number): Promise<void> => {
  try {
    await apiClient.patch(`/api/notifications/${notificationId}/read`);
  } catch (error: any) {
    console.error('알림 읽음 처리 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      throw new Error('알림을 찾을 수 없습니다.');
    }

    throw new Error(
      error.response?.data?.message || '알림 읽음 처리에 실패했습니다.'
    );
  }
};

/**
 * 모든 알림을 읽음 처리합니다. (일괄 처리)
 *
 * @returns Promise<void>
 *
 * @throws {Error} 일괄 읽음 처리 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await markAllAsRead();
 *   console.log("모든 알림을 읽음 처리했습니다.");
 * } catch (error) {
 *   console.error("일괄 읽음 처리 실패:", error);
 * }
 * ```
 */
export const markAllAsRead = async (): Promise<void> => {
  try {
    // 모든 알림 조회
    const notifications = await getNotifications();

    // 읽지 않은 알림만 필터링
    const unreadNotifications = notifications.filter(n => !n.isRead);

    // 각 알림을 읽음 처리 (병렬 처리)
    await Promise.all(
      unreadNotifications.map(notification => markAsRead(notification.id))
    );
  } catch (error: any) {
    console.error('일괄 읽음 처리 에러:', error);
    throw new Error('일괄 읽음 처리에 실패했습니다.');
  }
};

/**
 * 미읽음 알림 개수를 조회합니다.
 *
 * @returns Promise<number> - 미읽음 알림 개수
 *
 * @throws {Error} 미읽음 개수 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const count = await getUnreadCount();
 *   console.log("미읽음 알림:", count);
 * } catch (error) {
 *   console.error("미읽음 개수 조회 실패:", error);
 * }
 * ```
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const notifications = await getNotifications();
    return notifications.filter(n => !n.isRead).length;
  } catch (error: any) {
    console.error('미읽음 개수 조회 에러:', error);
    throw new Error('미읽음 개수 조회에 실패했습니다.');
  }
};
