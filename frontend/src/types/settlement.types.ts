// 정산 관련 타입 정의

/**
 * 정산 방식
 * - N_BUN_1: N분의 1 (균등 분할)
 * - DIRECT: 직접 입력 (각자 금액 지정)
 * - PERCENT: 퍼센트 방식 (비율로 지정)
 * - ITEM: 항목별 정산 (투표로 결정)
 */
export type SettlementMethod = 'N_BUN_1' | 'DIRECT' | 'PERCENT' | 'ITEM';

/**
 * 직접 입력 정산 항목
 */
export interface DirectSettlementEntry {
  userId: number;
  amount: number;
}

/**
 * 퍼센트 정산 항목
 */
export interface PercentSettlementEntry {
  userId: number;
  ratio: number; // 퍼센트 (예: 60.5)
}

/**
 * 정산 생성 요청 DTO
 */
export interface SettlementCreateRequest {
  expenseId: number;
  method: SettlementMethod;
  participantUserIds: number[];
  directEntries?: DirectSettlementEntry[];
  percentEntries?: PercentSettlementEntry[];
}

/**
 * 정산 응답 DTO
 */
export interface SettlementResponse {
  settlementId: number;
  expenseId: number;
  method: SettlementMethod;
  status: 'PENDING' | 'COMPLETED';
  totalAmount: number;
  details: SettlementDetailDto[];
}

/**
 * 정산 세부 내역 DTO
 * (누가 누구에게 얼마를 보내야 하는지)
 */
export interface SettlementDetailDto {
  debtorId: number;
  debtorName: string;
  creditorId: number;
  creditorName: string;
  amount: number;
  isSent: boolean;
  creditorBankName?: string;
  creditorAccountNumber?: string;
  transferUrl?: string; // 토스 딥링크
}
