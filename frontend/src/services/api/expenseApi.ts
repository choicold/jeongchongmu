import apiClient from './apiClient';
import {
  ExpenseCreateDTO,
  ExpenseSimpleDTO,
  ExpenseDetailDTO,
  ExpenseUpdateDTO,
} from '../../types/expense.types';

/**
 * 새 지출을 생성합니다.
 *
 * @param data - 지출 생성 요청 데이터
 * @returns Promise<ExpenseDetailDTO> - 생성된 지출 상세 정보
 *
 * @throws {Error} 지출 생성 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const expense = await createExpense({
 *     title: "회식비",
 *     amount: 50000,
 *     expenseData: "2025-01-15T18:00:00Z",
 *     groupId: 1,
 *     participantIds: [1, 2, 3],
 *     items: [{ name: "치킨", price: 25000, quantity: 2 }],
 *     tagNames: ["식비"]
 *   });
 *   console.log(expense.id);
 * } catch (error) {
 *   console.error("지출 생성 실패:", error);
 * }
 * ```
 */
export const createExpense = async (
  data: ExpenseCreateDTO
): Promise<ExpenseDetailDTO> => {
  try {
    const response = await apiClient.post<ExpenseDetailDTO>('/api/expenses', data);
    return response.data;
  } catch (error: any) {
    console.error('지출 생성 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '지출 생성에 실패했습니다.'
    );
  }
};

/**
 * 특정 그룹의 지출 목록을 조회합니다.
 *
 * @param groupId - 조회할 그룹 ID
 * @returns Promise<ExpenseSimpleDTO[]> - 지출 목록 배열
 *
 * @throws {Error} 지출 목록 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const expenses = await getExpensesByGroup(1);
 *   console.log(expenses.length); // 지출 개수
 * } catch (error) {
 *   console.error("지출 목록 조회 실패:", error);
 * }
 * ```
 */
export const getExpensesByGroup = async (
  groupId: number
): Promise<ExpenseSimpleDTO[]> => {
  try {
    const response = await apiClient.get<ExpenseSimpleDTO[]>(
      `/api/expenses?groupId=${groupId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('지출 목록 조회 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '지출 목록 조회에 실패했습니다.'
    );
  }
};

/**
 * 특정 지출의 상세 정보를 조회합니다.
 *
 * @param expenseId - 조회할 지출 ID
 * @returns Promise<ExpenseDetailDTO> - 지출 상세 정보
 *
 * @throws {Error} 지출 상세 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const expense = await getExpenseDetail(10);
 *   console.log(expense.title); // 지출 제목
 *   console.log(expense.items); // 지출 항목 리스트
 * } catch (error) {
 *   console.error("지출 상세 조회 실패:", error);
 * }
 * ```
 */
export const getExpenseDetail = async (
  expenseId: number
): Promise<ExpenseDetailDTO> => {
  try {
    const response = await apiClient.get<ExpenseDetailDTO>(
      `/api/expenses/${expenseId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('지출 상세 조회 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '지출 상세 조회에 실패했습니다.'
    );
  }
};

/**
 * 기존 지출을 수정합니다.
 *
 * @param expenseId - 수정할 지출 ID
 * @param data - 수정할 데이터 (일부 필드만 전달 가능)
 * @returns Promise<void>
 *
 * @throws {Error} 지출 수정 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await updateExpense(10, {
 *     title: "회식비 (수정)",
 *     amount: 60000
 *   });
 *   console.log("지출이 수정되었습니다.");
 * } catch (error) {
 *   console.error("지출 수정 실패:", error);
 * }
 * ```
 */
export const updateExpense = async (
  expenseId: number,
  data: ExpenseUpdateDTO
): Promise<void> => {
  try {
    await apiClient.patch(`/api/expenses/${expenseId}`, data);
  } catch (error: any) {
    console.error('지출 수정 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '지출 수정에 실패했습니다.'
    );
  }
};

/**
 * 지출을 삭제합니다.
 *
 * @param expenseId - 삭제할 지출 ID
 * @returns Promise<void>
 *
 * @throws {Error} 지출 삭제 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await deleteExpense(10);
 *   console.log("지출이 삭제되었습니다.");
 * } catch (error) {
 *   console.error("지출 삭제 실패:", error);
 * }
 * ```
 */
export const deleteExpense = async (expenseId: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/expenses/${expenseId}`);
  } catch (error: any) {
    console.error('지출 삭제 API 에러:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || '지출 삭제에 실패했습니다.'
    );
  }
};
