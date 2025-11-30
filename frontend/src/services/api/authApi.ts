import apiClient from './apiClient';
import { LoginRequest, LoginResponse, SignUpRequest, UserProfileResponse, UpdateProfileRequest } from '../../types/auth.types';

/**
 * 로그인
 * 이메일과 비밀번호로 로그인하고 JWT 토큰을 받습니다.
 *
 * @param data - 로그인 요청 데이터 (email, password)
 * @returns Promise<LoginResponse> - Bearer 토큰
 *
 * @throws {Error} 로그인 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const response = await login({
 *     email: "user@example.com",
 *     password: "password123"
 *   });
 *   console.log(response.bearerToken);
 * } catch (error) {
 *   console.error("로그인 실패:", error);
 * }
 * ```
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/api/user/login', data);
    return response.data;
  } catch (error: any) {
    console.error('로그인 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (error.response?.status === 404) {
      throw new Error('존재하지 않는 계정입니다.');
    }

    throw new Error(
      error.response?.data?.message || '로그인에 실패했습니다.'
    );
  }
};

/**
 * 회원가입
 * 새로운 사용자 계정을 생성합니다.
 *
 * @param data - 회원가입 요청 데이터 (email, password, name, bankName, accountNumber)
 * @returns Promise<string> - 성공 메시지
 *
 * @throws {Error} 회원가입 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const message = await signUp({
 *     email: "user@example.com",
 *     password: "password123",
 *     name: "홍길동",
 *     bankName: "국민은행",
 *     accountNumber: "123456789"
 *   });
 *   console.log(message); // "회원가입이 완료되었습니다."
 * } catch (error) {
 *   console.error("회원가입 실패:", error);
 * }
 * ```
 */
export const signUp = async (data: SignUpRequest): Promise<string> => {
  try {
    const response = await apiClient.post<string>('/api/user/signup', data);
    return response.data;
  } catch (error: any) {
    console.error('회원가입 API 에러:', error.response?.data || error.message);

    // 타임아웃 에러
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error(
        '서버 연결 시간 초과: 서버가 응답하지 않습니다. 서버가 실행 중인지 확인하고 다시 시도해주세요.'
      );
    }

    // 네트워크 에러
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      throw new Error(
        '네트워크 연결 실패: 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
      );
    }

    if (error.response?.status === 409) {
      throw new Error('이미 가입된 이메일입니다.');
    }

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '입력 정보를 확인해주세요.'
      );
    }

    throw new Error(
      error.response?.data?.message || '회원가입에 실패했습니다.'
    );
  }
};

/**
 * 사용자 프로필 조회
 * 현재 로그인한 사용자의 정보를 조회합니다.
 *
 * @returns Promise<UserProfileResponse> - 사용자 프로필 정보
 *
 * @throws {Error} 프로필 조회 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await getUserProfile();
 *   console.log(profile.name, profile.email);
 * } catch (error) {
 *   console.error("프로필 조회 실패:", error);
 * }
 * ```
 */
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  try {
    const response = await apiClient.get<UserProfileResponse>('/api/user/profile');
    return response.data;
  } catch (error: any) {
    console.error('프로필 조회 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }

    if (error.response?.status === 404) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    throw new Error(
      error.response?.data?.message || '프로필 조회에 실패했습니다.'
    );
  }
};

/**
 * 사용자 프로필 수정
 * 현재 로그인한 사용자의 프로필을 수정합니다.
 *
 * @param data - 프로필 수정 요청 데이터 (name, bankName, accountNumber)
 * @returns Promise<UserProfileResponse> - 수정된 사용자 프로필 정보
 *
 * @throws {Error} 프로필 수정 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   const updatedProfile = await updateUserProfile({
 *     name: "홍길동",
 *     bankName: "국민은행",
 *     accountNumber: "123456789"
 *   });
 *   console.log(updatedProfile);
 * } catch (error) {
 *   console.error("프로필 수정 실패:", error);
 * }
 * ```
 */
export const updateUserProfile = async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
  try {
    const response = await apiClient.put<UserProfileResponse>('/api/user/profile', data);
    return response.data;
  } catch (error: any) {
    console.error('프로필 수정 API 에러:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }

    if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message || '입력 정보를 확인해주세요.'
      );
    }

    throw new Error(
      error.response?.data?.message || '프로필 수정에 실패했습니다.'
    );
  }
};

/**
 * 로그아웃
 * 서버에 로그아웃을 요청하고 FCM 토큰을 삭제합니다.
 * 로컬 토큰은 클라이언트에서 직접 삭제해야 합니다.
 *
 * @returns Promise<string> - 성공 메시지
 *
 * @throws {Error} 로그아웃 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * try {
 *   await logout();
 *   console.log("로그아웃 성공");
 * } catch (error) {
 *   console.error("로그아웃 실패:", error);
 * }
 * ```
 */
export const logout = async (): Promise<string> => {
  try {
    const response = await apiClient.post<string>('/api/user/logout');
    return response.data;
  } catch (error: any) {
    console.error('로그아웃 API 에러:', error.response?.data || error.message);

    // 로그아웃 API 실패해도 클라이언트에서 토큰은 삭제되어야 함
    // 401 에러는 이미 로그아웃된 상태이므로 성공으로 처리
    if (error.response?.status === 401) {
      return '로그아웃되었습니다.';
    }

    throw new Error(
      error.response?.data?.message || '로그아웃에 실패했습니다.'
    );
  }
};
