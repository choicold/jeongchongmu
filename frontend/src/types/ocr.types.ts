// OCR 관련 타입 정의

import { ExpenseItemDTO } from './expense.types';

/**
 * OCR 스캔 결과 DTO
 */
export interface OcrResultDTO {
  title: string;
  amount: number;
  expenseData: string; // ISO 8601 format
  items: ExpenseItemDTO[];
}
