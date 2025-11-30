// 투표 관련 타입 정의

/**
 * 투표하기 요청 DTO
 */
export interface CastVoteRequest {
  userId: number;
  optionId: number;
}

/**
 * 투표 현황 응답 DTO
 */
export interface VoteResponse {
  voteId: number;
  expenseId: number;
  payerId: number; // 지출 등록자 ID (투표 생성자)
  isClosed: boolean;
  options: VoteOptionDto[];
}

/**
 * 투표 선택지 DTO
 */
export interface VoteOptionDto {
  optionId: number;
  itemName: string;
  price: number;
  votedUserIds: number[]; // 이 항목에 투표한 사용자 ID 목록
}
