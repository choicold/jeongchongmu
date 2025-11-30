import apiClient from './apiClient';
import { OcrResultDTO } from '../../types/ocr.types';

/**
 * 영수증 이미지를 OCR로 스캔하여 지출 정보를 추출합니다.
 *
 * @param imageUri - 영수증 이미지 URI (카메라 또는 갤러리에서 가져온 이미지)
 * @returns Promise<OcrResultDTO> - OCR 스캔 결과 (제목, 금액, 항목 리스트 등)
 *
 * @throws {Error} OCR 스캔 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * import * as ImagePicker from 'expo-image-picker';
 *
 * try {
 *   // 카메라로 영수증 촬영
 *   const result = await ImagePicker.launchCameraAsync({
 *     mediaTypes: ImagePicker.MediaTypeOptions.Images,
 *     quality: 1,
 *   });
 *
 *   if (!result.canceled) {
 *     const ocrResult = await scan(result.assets[0].uri);
 *     console.log(ocrResult.title); // "카페 라떼"
 *     console.log(ocrResult.amount); // 5000
 *     console.log(ocrResult.items); // [{ name: "아메리카노", price: 4500, quantity: 1 }]
 *   }
 * } catch (error) {
 *   console.error("OCR 스캔 실패:", error);
 * }
 * ```
 */
export const scan = async (imageUri: string): Promise<OcrResultDTO> => {
  try {
    // FormData 생성
    const formData = new FormData();

    // React Native에서 이미지를 FormData에 추가
    // @ts-ignore - React Native의 FormData는 타입이 다를 수 있음
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', // MIME 타입
      name: 'receipt.jpg', // 파일명
    });

    // OCR API 호출
    const response = await apiClient.post<OcrResultDTO>(
      '/api/ocr/scan',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // OCR 처리는 시간이 걸릴 수 있으므로 타임아웃 연장
        timeout: 30000, // 30초
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('OCR 스캔 API 에러:', error.response?.data || error.message);

    // 에러 타입에 따라 다른 메시지 반환
    if (error.code === 'ECONNABORTED') {
      throw new Error('OCR 처리 시간이 초과되었습니다. 다시 시도해주세요.');
    }

    if (error.response?.status === 400) {
      throw new Error('이미지 형식이 올바르지 않습니다.');
    }

    if (error.response?.status === 413) {
      throw new Error('이미지 파일이 너무 큽니다. 더 작은 이미지를 사용해주세요.');
    }

    throw new Error(
      error.response?.data?.message || '영수증 스캔에 실패했습니다.'
    );
  }
};
