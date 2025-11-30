import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import Constants from 'expo-constants';
import { getToken, removeToken } from '../../utils/storage';

/**
 * API Base URL
 * app.config.js의 extra.apiUrl 값을 사용하며, 없을 경우 기본값으로 localhost 사용
 */
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

// 개발 환경에서 API URL 확인
if (__DEV__) {
  console.log('🌐 API Base URL:', API_BASE_URL);
}

/**
 * Axios 인스턴스 생성
 * - baseURL: API 서버 주소
 * - timeout: 10초
 * - headers: Content-Type을 application/json으로 설정
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * - AsyncStorage에서 토큰을 가져와 Authorization 헤더에 자동 추가
 * - 토큰이 없는 경우(로그인/회원가입)에는 헤더를 추가하지 않음
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getToken();

      if (token) {
        // Authorization 헤더에 Bearer 토큰 추가
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 개발 환경에서 요청 로깅
      if (__DEV__) {
        console.log('📤 API 요청:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          headers: config.headers,
          data: config.data,
        });
      }

      return config;
    } catch (error) {
      console.error('요청 인터셉터 에러:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error('요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * - 401 Unauthorized 에러 발생 시 토큰 삭제
 * - 로그인 화면으로 리다이렉트는 호출하는 쪽에서 처리
 */
apiClient.interceptors.response.use(
  (response) => {
    // 개발 환경에서 응답 로깅
    if (__DEV__) {
      console.log('📥 API 응답 성공:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    // 401 에러 처리 (인증 실패)
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized: 토큰이 유효하지 않습니다. 토큰을 삭제합니다.');

      try {
        // AsyncStorage에서 토큰 삭제
        await removeToken();
      } catch (removeError) {
        console.error('토큰 삭제 실패:', removeError);
      }

      // 로그인 화면으로 리다이렉트는 AuthContext나 네비게이션에서 처리
      // 여기서는 에러만 반환
    }

    // 상세한 에러 로깅
    if (__DEV__) {
      const errorDetails = {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      };

      console.error('❌ API 에러 상세:', errorDetails);

      // 타임아웃 에러인 경우
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⏱️  타임아웃 에러: 서버가 응답하지 않습니다.');
        console.error('💡 해결 방법:');
        console.error('   1. 서버가 실행 중인지 확인하세요');
        console.error('   2. API URL이 올바른지 확인하세요:', error.config?.baseURL);
        console.error('   3. 네트워크 연결을 확인하세요');
      }

      // 네트워크 에러인 경우
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.error('🌐 네트워크 에러: 서버에 연결할 수 없습니다.');
        console.error('💡 해결 방법:');
        console.error('   1. 서버 URL을 확인하세요:', error.config?.baseURL);
        console.error('   2. 모바일에서는 localhost 대신 PC의 IP 주소를 사용하세요');
        console.error('   3. 방화벽 설정을 확인하세요');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
