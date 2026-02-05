import { GroupDto } from './group.types';

/**
 * 최근 활동 DTO
 */
export interface RecentActivityDto {
  expenseId: number;
  groupId: number;
  title: string;
  amount: number;
  payerName: string;
  expenseDate: string;
  settlementId: number | null;
  settlementStatus: 'PENDING' | 'COMPLETED' | null;
  participants: string[];
}

/**
 * 대시보드 응답 DTO
 */
export interface DashboardResponseDto {
  groups: GroupDto[];
  thisMonthExpense: number;
  recentActivities: RecentActivityDto[];
  toReceive: number;
  toSend: number;
}
