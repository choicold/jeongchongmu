import apiClient from './apiClient';
import {
  SettlementCreateRequest,
  SettlementResponse,
} from '../../types/settlement.types';

/**
 * 정산을 생성합니다.
 * N분의 1, 직접 입력, 퍼센트, 항목별 정산 중 하나의 방식을 선택하여 생성합니다.
 *
 * @param data - 정산 생성 요청 데이터
 * @returns Promise<SettlementResponse> - 정산 결과 (누가 누구에게 얼마를 보낼지)
 *
 * @throws {Error} 정산 생성 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * // N분의 1 정산
 * try {
 *   const settlement = await createSettlement({
 *     expenseId: 10,
 *     method: 'N_BUN_1',
 *     participantUserIds: [1, 2, 3]
 *   });
 *   console.log(settlement.details); // 정산 세부 내역
 * } catch (error) {
 *   console.error("정산 생성 실패:", error);
 * }
 *
 * // 직접 입력 정산
 * const settlement = await createSettlement({
 *   expenseId: 10,
 *   method: 'DIRECT',
 *   participantUserIds: [1, 2, 3],
 *   directEntries: [
 *     { userId: 1, amount: 20000 },
 *     { userId: 2, amount: 15000 },
 *     { userId: 3, amount: 15000 }
 *   ]
 * });
 * ```
 */
export const createSettlement = async (
  data: SettlementCreateRequest
): Promise<SettlementResponse> => {
  try {
    const response = await apiClient.post<SettlementResponse>(
      '/api/settlements',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('정산 생성 API 에러:', error.response?.data || error.message);

    // 정산 금액 불일치 에러 등 특정 에러 처리
    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '정산 금액이 맞지 않습니다.'
      );
    }

    // 중복 정산 에러 처리
    if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || error.response?.data;
      if (typeof errorMessage === 'string' && errorMessage.includes('정산이 이미 존재합니다')) {
        throw new Error('이미 정산이 생성된 지출입니다. 기존 정산을 확인해주세요.');
      }
    }

    throw new Error(
      error.response?.data?.message || '정산 생성에 실패했습니다.'
    );
  }
};

/**
 * 특정 정산의 상세 정보를 조회합니다.
 *
 * @param settlementId - 조회할 정산 ID
 * @returns Promise<SettlementResponse> - 정산 상세 정보
 *
 * @throws {Error} 정산 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const settlement = await getSettlement(5);
 *   console.log(settlement.status); // "PENDING" 또는 "COMPLETED"
 * } catch (error) {
 *   console.error("정산 조회 실패:", error);
 * }
 * ```
 */
export const getSettlement = async (
  settlementId: number
): Promise<SettlementResponse> => {
  try {
    const response = await apiClient.get<SettlementResponse>(
      `/api/settlements/${settlementId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('정산 조회 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '정산 조회에 실패했습니다.'
    );
  }
};

/**
 * 지출 ID로 정산을 조회합니다.
 *
 * @param expenseId - 조회할 지출 ID
 * @returns Promise<SettlementResponse> - 정산 상세 정보
 *
 * @throws {Error} 정산 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const settlement = await getSettlementByExpenseId(10);
 *   console.log(settlement.settlementId);
 * } catch (error) {
 *   console.error("정산 조회 실패:", error);
 * }
 * ```
 */
export const getSettlementByExpenseId = async (
  expenseId: number
): Promise<SettlementResponse> => {
  try {
    const response = await apiClient.get<SettlementResponse>(
      `/api/settlements/by-expense/${expenseId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('정산 조회 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '정산 조회에 실패했습니다.'
    );
  }
};

/**
 * 사용자의 정산 현황을 조회합니다. (추후 백엔드 구현 필요)
 * 사용자가 받아야 할 돈과 보내야 할 돈의 총계를 반환합니다.
 *
 * @returns Promise<{ toReceive: number; toSend: number }> - 받을 돈과 보낼 돈
 *
 * @throws {Error} 정산 현황 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const { toReceive, toSend } = await getMySettlementSummary();
 *   console.log(`받을 돈: ${toReceive.toLocaleString()}원`);
 *   console.log(`보낼 돈: ${toSend.toLocaleString()}원`);
 * } catch (error) {
 *   console.error("정산 현황 조회 실패:", error);
 * }
 * ```
 *
 * TODO: 백엔드에 다음 API 엔드포인트 추가 필요
 * GET /api/settlements/my-summary
 * Response: { toReceive: number, toSend: number }
 */
export const getMySettlementSummary = async (): Promise<{
  toReceive: number;
  toSend: number;
}> => {
  try {
    const response = await apiClient.get<{
      toReceive: number;
      toSend: number;
    }>('/api/settlements/my-summary');
    return response.data;
  } catch (error: any) {
    console.error(
      '정산 현황 조회 API 에러:',
      error.response?.data || error.message
    );
    // 임시로 0 반환 (백엔드 구현 전까지)
    if (error.response?.status === 404) {
      return { toReceive: 0, toSend: 0 };
    }
    throw new Error(
      error.response?.data?.message || '정산 현황 조회에 실패했습니다.'
    );
  }
};

/**
 * 정산을 수정(재정산)합니다.
 *
 * @param settlementId - 수정할 정산 ID
 * @param data - 정산 수정 요청 데이터
 * @returns Promise<SettlementResponse> - 수정된 정산 결과
 *
 * @throws {Error} 정산 수정 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const updated = await updateSettlement(5, {
 *     expenseId: 10,
 *     method: 'N_BUN_1',
 *     participantUserIds: [1, 2, 3, 4]
 *   });
 *   console.log('재정산 완료:', updated);
 * } catch (error) {
 *   console.error("정산 수정 실패:", error);
 * }
 * ```
 */
export const updateSettlement = async (
  settlementId: number,
  data: SettlementCreateRequest
): Promise<SettlementResponse> => {
  try {
    const response = await apiClient.put<SettlementResponse>(
      `/api/settlements/${settlementId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('정산 수정 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '정산 수정 요청이 올바르지 않습니다.'
      );
    }

    if (error.response?.status === 404) {
      throw new Error('정산을 찾을 수 없습니다.');
    }

    throw new Error(
      error.response?.data?.message || '정산 수정에 실패했습니다.'
    );
  }
};

/**
 * 정산을 삭제합니다.
 *
 * @param settlementId - 삭제할 정산 ID
 * @returns Promise<void>
 *
 * @throws {Error} 정산 삭제 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await deleteSettlement(5);
 *   console.log('정산이 삭제되었습니다');
 * } catch (error) {
 *   console.error("정산 삭제 실패:", error);
 * }
 * ```
 */
export const deleteSettlement = async (
  settlementId: number
): Promise<void> => {
  try {
    await apiClient.delete(`/api/settlements/${settlementId}`);
  } catch (error: any) {
    console.error('정산 삭제 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      throw new Error('정산을 찾을 수 없습니다.');
    }

    if (error.response?.status === 403) {
      throw new Error('정산을 삭제할 권한이 없습니다.');
    }

    throw new Error(
      error.response?.data?.message || '정산 삭제에 실패했습니다.'
    );
  }
};

/**
 * 송금 완료를 확인합니다.
 * 사용자가 송금 버튼을 누르면 호출되며, 모든 멤버가 송금 완료 시 정산 상태가 COMPLETED로 변경됩니다.
 *
 * @param settlementId - 정산 ID
 * @param debtorId - 채무자(송금하는 사람) ID
 * @param creditorId - 채권자(받는 사람) ID
 * @returns Promise<SettlementResponse> - 업데이트된 정산 정보
 *
 * @throws {Error} 송금 확인 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const updated = await confirmTransfer(5, 1, 2);
 *   console.log('송금 확인 완료:', updated.status);
 * } catch (error) {
 *   console.error("송금 확인 실패:", error);
 * }
 * ```
 */
export const confirmTransfer = async (
  settlementId: number,
  debtorId: number,
  creditorId: number
): Promise<SettlementResponse> => {
  try {
    const response = await apiClient.post<SettlementResponse>(
      `/api/settlements/${settlementId}/confirm-transfer`,
      {
        debtorId,
        creditorId,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('송금 확인 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      throw new Error('정산을 찾을 수 없습니다.');
    }

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '송금 확인 요청이 올바르지 않습니다.'
      );
    }

    throw new Error(
      error.response?.data?.message || '송금 확인에 실패했습니다.'
    );
  }
};
