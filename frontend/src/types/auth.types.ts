// 인증 관련 타입 정의

/**
 * 회원가입 요청 DTO
 */
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  bankName: string;
  accountNumber: string;
}

/**
 * 로그인 요청 DTO
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 로그인 응답 DTO
 */
export interface LoginResponse {
  bearerToken: string;
  id: number;
  email: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
}

/**
 * 사용자 프로필 응답 DTO
 */
export interface UserProfileResponse {
  id: number;
  email: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
}

/**
 * 사용자 프로필 수정 요청 DTO
 */
export interface UpdateProfileRequest {
  name: string;
  bankName: string;
  accountNumber: string;
}
