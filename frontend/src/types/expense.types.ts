// 지출 관련 타입 정의

/**
 * 지출 항목 DTO (개별 품목)
 */
export interface ExpenseItemDTO {
  name: string;
  price: number;
  quantity: number;
}

/**
 * 지출 생성 요청 DTO
 */
export interface ExpenseCreateDTO {
  title: string;
  amount: number;
  expenseData: string; // ISO 8601 format (예: "2025-01-15T10:30:00Z")
  groupId: number;
  participantIds: number[];
  items: ExpenseItemDTO[];
  tagNames: string[];
  receiptUrl?: string;
}

/**
 * 지출 간단 정보 DTO (목록 조회용)
 */
export interface ExpenseSimpleDTO {
  id: number;
  title: string;
  amount: number;
  payerName: string;
  expenseData: string;
  settlementId?: number; // 정산 ID (정산이 생성되지 않은 경우 undefined)
  voteId?: number; // 투표 ID (투표가 생성되지 않은 경우 undefined)
  isVoteClosed?: boolean; // 투표 마감 여부 (투표가 없으면 undefined)
}

/**
 * 지출 상세 정보 DTO
 */
export interface ExpenseDetailDTO {
  id: number;
  title: string;
  amount: number;
  expenseData: string;
  receiptUrl?: string;
  payerName: string;
  groupId: number;
  items: ExpenseItemDTO[];
  participants: string[]; // 참여자 이름 배열
  tagNames: string[];
  settlementId?: number; // 정산 ID (정산이 생성되지 않은 경우 undefined)
}

/**
 * 지출 수정 요청 DTO
 */
export interface ExpenseUpdateDTO {
  title?: string;
  amount?: number;
  expenseData?: string;
  participantIds?: number[];
  items?: ExpenseItemDTO[];
  tagNames?: string[];
}
