// 그룹 관련 타입 정의

/**
 * 사용자 요약 정보 DTO
 */
export interface UserSummaryDto {
  id: number;
  name: string;
}

/**
 * 그룹 생성/수정 요청 DTO
 */
export interface GroupRequest {
  name: string;
  description?: string;
  icon?: string;
}

/**
 * 그룹 정보 DTO
 */
export interface GroupDto {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  inviteCode: string;
  inviteLink: string;
  creator: UserSummaryDto;
  memberCount: number;
  createdAt: string;
}

/**
 * 초대 코드로 그룹 참여 요청 DTO
 */
export interface JoinGroupByCodeRequest {
  inviteCode: string;
}

/**
 * 그룹 멤버 정보 DTO
 */
export interface GroupMemberDto {
  id: number;
  groupId: number;
  user: UserSummaryDto;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}
