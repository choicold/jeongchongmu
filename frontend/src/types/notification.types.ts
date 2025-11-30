// 알림 관련 타입 정의

/**
 * 알림 타입
 */
export type NotificationType =
  | 'SETTLEMENT_REQUEST'    // 정산 요청
  | 'SETTLEMENT_REMINDER'   // 정산 리마인더
  | 'VOTE_CREATED'          // 투표 생성
  | 'VOTE_CLOSE'            // 투표 마감
  | 'EXPENSE_ADDED'         // 지출 추가
  | 'GROUP_INVITE';         // 그룹 초대

/**
 * 알림 정보 DTO
 */
export interface NotificationDto {
  id: number;
  type: NotificationType;
  content: string;
  relatedId?: number; // 관련된 리소스 ID (지출 ID, 정산 ID 등)
  isRead: boolean;
  createdAt: string;
}
