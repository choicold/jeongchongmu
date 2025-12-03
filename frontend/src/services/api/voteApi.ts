import apiClient from './apiClient';
import { CastVoteRequest, VoteResponse } from '../../types/vote.types';

/**
 * 항목별 정산을 위한 투표를 생성합니다.
 * 지출의 각 항목(메뉴)이 투표 선택지가 됩니다.
 *
 * @param expenseId - 투표를 생성할 지출 ID
 * @returns Promise<number> - 생성된 투표 ID
 *
 * @throws {Error} 투표 생성 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const voteId = await createVote(10);
 *   console.log("투표 ID:", voteId);
 * } catch (error) {
 *   console.error("투표 생성 실패:", error);
 * }
 * ```
 */
export const createVote = async (expenseId: number): Promise<number> => {
  try {
    const response = await apiClient.post<number>(`/api/votes/${expenseId}`);
    return response.data;
  } catch (error: any) {
    console.error('투표 생성 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '이미 투표가 생성된 지출입니다.'
      );
    }

    throw new Error(
      error.response?.data?.message || '투표 생성에 실패했습니다.'
    );
  }
};

/**
 * 투표를 진행합니다.
 * 항목별 정산 시 각 멤버가 자신이 먹은 메뉴를 선택합니다.
 *
 * @param data - 투표 요청 데이터 (사용자 ID, 선택한 옵션 ID)
 * @returns Promise<string> - "투표 반영 완료" 메시지
 *
 * @throws {Error} 투표 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const result = await castVote({
 *     userId: 1,
 *     optionId: 3
 *   });
 *   console.log(result); // "투표 반영 완료"
 * } catch (error) {
 *   console.error("투표 실패:", error);
 * }
 * ```
 */
export const castVote = async (data: CastVoteRequest): Promise<string> => {
  try {
    const response = await apiClient.post<string>('/api/votes/cast', data);
    return response.data;
  } catch (error: any) {
    console.error('투표 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '이미 투표한 항목입니다.'
      );
    }

    if (error.response?.status === 403) {
      throw new Error('투표가 마감되었습니다.');
    }

    throw new Error(
      error.response?.data?.message || '투표에 실패했습니다.'
    );
  }
};

/**
 * 투표 현황을 조회합니다.
 * 각 옵션(메뉴)별로 누가 투표했는지 확인할 수 있습니다.
 *
 * @param expenseId - 투표 현황을 조회할 지출 ID
 * @returns Promise<VoteResponse | null> - 투표 현황 (옵션별 투표자 목록), 투표가 없으면 null
 *
 * @throws {Error} 투표 현황 조회 실패 시 에러 발생 (404 제외)
 *
 * @example
 * ```typescript
 * const voteStatus = await getVoteStatus(10);
 * if (voteStatus) {
 *   console.log("투표 마감 여부:", voteStatus.isClosed);
 *   voteStatus.options.forEach(option => {
 *     console.log(`${option.itemName}: ${option.votedUserIds.length}명 선택`);
 *   });
 * } else {
 *   console.log("투표가 아직 생성되지 않았습니다.");
 * }
 * ```
 */
export const getVoteStatus = async (expenseId: number): Promise<VoteResponse | null> => {
  try {
    const response = await apiClient.get<VoteResponse>(`/api/votes/${expenseId}`);
    return response.data;
  } catch (error: any) {
    console.error('투표 현황 조회 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      // 투표가 없는 것은 정상적인 상황이므로 null 반환
      return null;
    }

    throw new Error(
      error.response?.data?.message || '투표 현황 조회에 실패했습니다.'
    );
  }
};

/**
 * 투표를 마감합니다.
 * 투표가 마감되면 더 이상 투표할 수 없으며, 정산이 생성됩니다.
 *
 * @param expenseId - 투표를 마감할 지출 ID
 * @returns Promise<number> - 생성된 정산 ID
 *
 * @throws {Error} 투표 마감 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const settlementId = await closeVote(10);
 *   console.log("생성된 정산 ID:", settlementId);
 * } catch (error) {
 *   console.error("투표 마감 실패:", error);
 * }
 * ```
 */
export const closeVote = async (expenseId: number): Promise<number> => {
  try {
    const response = await apiClient.post<number>(`/api/votes/${expenseId}/close`);
    return response.data;
  } catch (error: any) {
    console.error('투표 마감 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 403) {
      throw new Error('투표를 마감할 권한이 없습니다.');
    }

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '이미 마감된 투표입니다.'
      );
    }

    throw new Error(
      error.response?.data?.message || '투표 마감에 실패했습니다.'
    );
  }
};

/**
 * 투표를 삭제합니다.
 * 투표를 삭제하면 모든 투표 데이터가 삭제되며, 투표를 다시 생성할 수 있습니다.
 *
 * @param expenseId - 투표를 삭제할 지출 ID
 * @returns Promise<string> - "투표가 삭제되었습니다." 메시지
 *
 * @throws {Error} 투표 삭제 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await deleteVote(10);
 *   console.log("투표 삭제 완료");
 * } catch (error) {
 *   console.error("투표 삭제 실패:", error);
 * }
 * ```
 */
export const deleteVote = async (expenseId: number): Promise<string> => {
  try {
    const response = await apiClient.delete<string>(`/api/votes/${expenseId}`);
    return response.data;
  } catch (error: any) {
    console.error('투표 삭제 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      throw new Error('투표가 존재하지 않습니다.');
    }

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '이미 마감된 투표는 삭제할 수 없습니다.'
      );
    }

    throw new Error(
      error.response?.data?.message || '투표 삭제에 실패했습니다.'
    );
  }
};
