import * as ocrApi from './api/ocrApi';
import { OcrResultDTO } from '../types/ocr.types';

/**
 * OCRService - OCR 관련 비즈니스 로직
 *
 * expo-image-picker로 촬영한 이미지를 서버로 전송하고 OCR 결과를 받습니다.
 */

/**
 * 영수증 스캔 및 OCR 분석
 *
 * @param imageUri - expo-image-picker에서 반환한 이미지 URI
 * @returns OCR 분석 결과 (제목, 금액, 항목 리스트)
 *
 * @example
 * ```typescript
 * const result = await OCRService.scanReceipt('file:///path/to/image.jpg');
 * console.log(result.title); // "카페 영수증"
 * console.log(result.amount); // 15000
 * console.log(result.items); // [{ name: "아메리카노", price: 4500, quantity: 2 }, ...]
 * ```
 */
export const scanReceipt = async (imageUri: string): Promise<OcrResultDTO> => {
  try {
    // API 호출 - imageUri를 그대로 전달
    const result = await ocrApi.scan(imageUri);

    return result;
  } catch (error: any) {
    console.error('OCR 스캔 에러:', error);
    throw new Error(
      error.message || 'OCR 분석에 실패했습니다. 다시 시도해주세요.'
    );
  }
};

/**
 * 이미지 URI 검증
 */
export const validateImageUri = (uri: string): boolean => {
  if (!uri) return false;

  // 로컬 파일 URI 체크
  if (uri.startsWith('file://')) return true;

  // content:// URI 체크 (Android)
  if (uri.startsWith('content://')) return true;

  // http(s) URI 체크
  if (uri.startsWith('http://') || uri.startsWith('https://')) return true;

  return false;
};

/**
 * OCR 결과 검증
 */
export const validateOcrResult = (result: OcrResultDTO): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 제목 검증
  if (!result.title || result.title.trim().length === 0) {
    errors.push('제목이 인식되지 않았습니다.');
  }

  // 금액 검증
  if (!result.amount || result.amount <= 0) {
    errors.push('금액이 올바르게 인식되지 않았습니다.');
  }

  // 항목 검증
  if (!result.items || result.items.length === 0) {
    errors.push('항목이 인식되지 않았습니다.');
  } else {
    // 각 항목 검증
    result.items.forEach((item, index) => {
      if (!item.name || item.name.trim().length === 0) {
        errors.push(`항목 ${index + 1}의 이름이 없습니다.`);
      }
      if (!item.price || item.price < 0) {
        errors.push(`항목 ${index + 1}의 가격이 올바르지 않습니다.`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`항목 ${index + 1}의 수량이 올바르지 않습니다.`);
      }
    });
  }

  // 항목 합계와 총액 비교
  if (result.items && result.items.length > 0) {
    const itemsTotal = result.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 오차 범위 ±10% 허용
    const diff = Math.abs(itemsTotal - result.amount);
    const errorMargin = result.amount * 0.1;

    if (diff > errorMargin) {
      errors.push(
        `항목 합계(${itemsTotal.toLocaleString()}원)와 총액(${result.amount.toLocaleString()}원)이 일치하지 않습니다.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
