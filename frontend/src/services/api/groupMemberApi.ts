import apiClient from './apiClient';
import {
  JoinGroupByCodeRequest,
  GroupMemberDto,
} from '../../types/group.types';

/**
 * 초대 코드를 사용하여 그룹에 참여합니다.
 *
 * @param data - 초대 코드 요청 데이터
 * @returns Promise<GroupMemberDto> - 참여한 그룹의 멤버 정보
 *
 * @example
 * ```typescript
 * const member = await joinGroup({ inviteCode: "ABC123" });
 * console.log(member.role); // "MEMBER"
 * ```
 */
export const joinGroup = async (
  data: JoinGroupByCodeRequest
): Promise<GroupMemberDto> => {
  const response = await apiClient.post<GroupMemberDto>('/api/groups/join', data);
  return response.data;
};

/**
 * 특정 그룹의 멤버 목록을 조회합니다.
 *
 * @param groupId - 조회할 그룹 ID
 * @returns Promise<GroupMemberDto[]> - 그룹 멤버 목록 배열
 *
 * @example
 * ```typescript
 * const members = await getGroupMembers(1);
 * console.log(members.length); // 멤버 수
 * members.forEach(m => console.log(m.user.name)); // 멤버 이름 출력
 * ```
 */
export const getGroupMembers = async (
  groupId: number
): Promise<GroupMemberDto[]> => {
  const response = await apiClient.get<GroupMemberDto[]>(
    `/api/groups/${groupId}/members`
  );
  return response.data;
};

/**
 * 특정 그룹의 특정 멤버 정보를 조회합니다.
 *
 * @param groupId - 그룹 ID
 * @param memberId - 멤버 ID
 * @returns Promise<GroupMemberDto> - 멤버 상세 정보
 *
 * @example
 * ```typescript
 * const member = await getGroupMember(1, 5);
 * console.log(member.user.name); // 멤버 이름
 * console.log(member.role); // "OWNER" 또는 "MEMBER"
 * ```
 */
export const getGroupMember = async (
  groupId: number,
  memberId: number
): Promise<GroupMemberDto> => {
  const response = await apiClient.get<GroupMemberDto>(
    `/api/groups/${groupId}/members/${memberId}`
  );
  return response.data;
};

/**
 * 그룹에서 특정 멤버를 강제 퇴출합니다. (OWNER 권한 필요)
 *
 * @param groupId - 그룹 ID
 * @param targetUserId - 퇴출할 사용자 ID
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await removeMember(1, 5);
 * console.log("멤버가 퇴출되었습니다.");
 * ```
 */
export const removeMember = async (
  groupId: number,
  targetUserId: number
): Promise<void> => {
  await apiClient.delete(`/api/groups/${groupId}/members/${targetUserId}`);
};

/**
 * 현재 사용자가 그룹에서 스스로 탈퇴합니다.
 *
 * @param groupId - 탈퇴할 그룹 ID
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await leaveGroup(1);
 * console.log("그룹에서 탈퇴했습니다.");
 * ```
 */
export const leaveGroup = async (groupId: number): Promise<void> => {
  await apiClient.delete(`/api/groups/${groupId}/leave`);
};
