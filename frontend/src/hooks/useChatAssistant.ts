import { useState, useRef, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/api/apiClient';

/**
 * 채팅 메시지 타입
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[]; // 사용자 메시지에 첨부된 이미지 URI 배열
}

/**
 * MCP Chat API 응답 타입
 */
interface McpChatResponse {
  data: string; // 백엔드에서 plain string으로 반환
}

/**
 * Chat Assistant Hook
 *
 * MCP Chat API와 통신하며 채팅 메시지 관리, 이미지 업로드, 로딩 상태 관리를 담당합니다.
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   isLoading,
 *   error,
 *   sendMessage,
 *   pickImages,
 *   selectedImages,
 *   clearSelectedImages,
 *   clearChat
 * } = useChatAssistant();
 *
 * // 메시지 전송
 * await sendMessage('안녕하세요');
 *
 * // 이미지 선택
 * await pickImages();
 * ```
 */
export const useChatAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const messageIdCounter = useRef(0);

  /**
   * 이미지 선택 함수 (최대 5개)
   */
  const pickImages = useCallback(async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        setError('이미지 접근 권한이 필요합니다.');
        return;
      }

      // 이미지 선택 (최대 5개)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - selectedImages.length, // 이미 선택된 이미지 고려
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImageUris = result.assets.map(asset => asset.uri);
        const totalImages = [...selectedImages, ...newImageUris];

        if (totalImages.length > 5) {
          setError('이미지는 최대 5장까지 선택할 수 있습니다.');
          return;
        }

        setSelectedImages(totalImages);
        setError(null);
      }
    } catch (err) {
      console.error('이미지 선택 실패:', err);
      setError('이미지 선택에 실패했습니다.');
    }
  }, [selectedImages]);

  /**
   * 선택된 이미지 제거
   */
  const removeImage = useCallback((uri: string) => {
    setSelectedImages(prev => prev.filter(img => img !== uri));
  }, []);

  /**
   * 선택된 이미지 전체 제거
   */
  const clearSelectedImages = useCallback(() => {
    setSelectedImages([]);
  }, []);

  /**
   * 메시지 전송 함수
   *
   * @param messageText - 전송할 텍스트 메시지
   */
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() && selectedImages.length === 0) {
      setError('메시지를 입력하거나 이미지를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 사용자 메시지 추가
      const userMessage: ChatMessage = {
        id: `user-${messageIdCounter.current++}`,
        role: 'user',
        content: messageText.trim() || '이미지 업로드',
        timestamp: new Date(),
        images: selectedImages.length > 0 ? [...selectedImages] : undefined,
      };

      setMessages(prev => [...prev, userMessage]);

      // FormData 생성
      const formData = new FormData();
      formData.append('message', messageText.trim() || '이미지를 분석해주세요');

      // 이미지 첨부 (최대 5개)
      if (selectedImages.length > 0) {
        selectedImages.forEach((imageUri, index) => {
          // @ts-ignore - React Native FormData 타입 이슈
          formData.append('files', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `image-${index}.jpg`,
          });
        });
      }

      // API 호출
      const response = await apiClient.post<string>(
        '/api/mcp/chat',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // AI 응답 대기 시간: 60초
        }
      );

      // AI 응답 메시지 추가
      const assistantMessage: ChatMessage = {
        id: `assistant-${messageIdCounter.current++}`,
        role: 'assistant',
        content: response.data, // 백엔드에서 plain string 반환
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 전송 후 이미지 초기화
      clearSelectedImages();
    } catch (err: any) {
      console.error('메시지 전송 실패:', err);

      let errorMessage = '메시지 전송에 실패했습니다.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'AI 응답 시간이 초과되었습니다. 다시 시도해주세요.';
      } else if (err.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      } else if (err.response?.status === 413) {
        errorMessage = '이미지 파일이 너무 큽니다.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedImages, clearSelectedImages]);

  /**
   * 채팅 내역 초기화
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    clearSelectedImages();
  }, [clearSelectedImages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    pickImages,
    selectedImages,
    removeImage,
    clearSelectedImages,
    clearChat,
  };
};
