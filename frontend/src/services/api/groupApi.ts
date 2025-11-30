import apiClient from './apiClient';
import { GroupDto, GroupRequest } from '../../types/group.types';

/**
 * 새 그룹을 생성합니다.
 *
 * @param data - 그룹 생성 요청 데이터 (name, description)
 * @returns Promise<GroupDto> - 생성된 그룹 정보 (초대 코드 포함)
 *
 * @example
 * ```typescript
 * const newGroup = await createGroup({
 *   name: "제주도 여행",
 *   description: "2025년 1월 제주도 여행 모임"
 * });
 * console.log(newGroup.inviteCode); // 초대 코드
 * ```
 */
export const createGroup = async (data: GroupRequest): Promise<GroupDto> => {
  const response = await apiClient.post<GroupDto>('/api/groups', data);
  return response.data;
};

/**
 * 내가 속한 그룹 목록을 조회합니다.
 *
 * @returns Promise<GroupDto[]> - 그룹 목록 배열
 *
 * @example
 * ```typescript
 * const myGroups = await getMyGroups();
 * console.log(myGroups.length); // 내가 속한 그룹 개수
 * ```
 */
export const getMyGroups = async (): Promise<GroupDto[]> => {
  const response = await apiClient.get<GroupDto[]>('/api/groups');
  return response.data;
};

/**
 * 특정 그룹의 상세 정보를 조회합니다.
 *
 * @param groupId - 조회할 그룹 ID
 * @returns Promise<GroupDto> - 그룹 상세 정보
 *
 * @example
 * ```typescript
 * const group = await getGroupDetail(1);
 * console.log(group.name); // 그룹명
 * console.log(group.memberCount); // 멤버 수
 * ```
 */
export const getGroupDetail = async (groupId: number): Promise<GroupDto> => {
  const response = await apiClient.get<GroupDto>(`/api/groups/${groupId}`);
  return response.data;
};

/**
 * 그룹 정보를 수정합니다. (OWNER 권한 필요)
 *
 * @param groupId - 수정할 그룹 ID
 * @param data - 수정할 데이터 (name, description)
 * @returns Promise<GroupDto> - 수정된 그룹 정보
 *
 * @example
 * ```typescript
 * const updatedGroup = await updateGroup(1, {
 *   name: "제주도 여행 (수정)",
 *   description: "날짜 변경됨"
 * });
 * ```
 */
export const updateGroup = async (
  groupId: number,
  data: GroupRequest
): Promise<GroupDto> => {
  const response = await apiClient.put<GroupDto>(`/api/groups/${groupId}`, data);
  return response.data;
};

/**
 * 그룹을 삭제합니다. (OWNER 권한 필요)
 *
 * @param groupId - 삭제할 그룹 ID
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await deleteGroup(1);
 * console.log("그룹이 삭제되었습니다.");
 * ```
 */
export const deleteGroup = async (groupId: number): Promise<void> => {
  await apiClient.delete(`/api/groups/${groupId}`);
};

/**
 * 그룹의 초대 코드를 재생성합니다.
 * 기존 초대 코드는 무효화되고 새로운 코드가 발급됩니다.
 *
 * @param groupId - 초대 코드를 재생성할 그룹 ID
 * @returns Promise<GroupDto> - 새로운 초대 코드가 포함된 그룹 정보
 *
 * @example
 * ```typescript
 * const group = await regenerateInviteCode(1);
 * console.log(group.inviteCode); // 새로운 초대 코드
 * ```
 */
export const regenerateInviteCode = async (groupId: number): Promise<GroupDto> => {
  const response = await apiClient.post<GroupDto>(
    `/api/groups/${groupId}/invite-code`
  );
  return response.data;
};
