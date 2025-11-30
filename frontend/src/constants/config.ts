import Constants from 'expo-constants';

/**
 * 앱 설정 상수
 * 환경 변수 및 앱 전역 설정을 관리합니다.
 *
 * @example
 * ```tsx
 * import { CONFIG } from '../constants/config';
 *
 * console.log(CONFIG.API_BASE_URL);
 * console.log(CONFIG.IS_DEV);
 * ```
 */

/**
 * 환경 변수
 */
const ENV = {
  API_URL: Constants.expoConfig?.extra?.apiUrl,
  ENVIRONMENT: Constants.expoConfig?.extra?.environment || 'development',
} as const;

/**
 * API 설정
 */
export const API_CONFIG = {
  /**
   * API 기본 URL
   * app.config.js의 extra.apiUrl 값을 사용하며, 없을 경우 기본값 사용
   */
  BASE_URL: ENV.API_URL || 'http://localhost:8080',

  /**
   * API 타임아웃 (밀리초)
   */
  TIMEOUT: 10000, // 10초

  /**
   * OCR API 타임아웃 (밀리초)
   * OCR 처리는 시간이 더 걸릴 수 있으므로 별도 설정
   */
  OCR_TIMEOUT: 30000, // 30초

  /**
   * API 재시도 설정
   */
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1초
  },
} as const;

/**
 * 앱 정보
 */
export const APP_INFO = {
  NAME: '정총무',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber || '1',
  BUNDLE_ID: Constants.expoConfig?.ios?.bundleIdentifier || 'com.jeongchongmu.app',
} as const;

/**
 * 환경 설정
 */
export const ENVIRONMENT = {
  IS_DEV: __DEV__,
  IS_PRODUCTION: ENV.ENVIRONMENT === 'production',
  IS_STAGING: ENV.ENVIRONMENT === 'staging',
  CURRENT: ENV.ENVIRONMENT,
} as const;

/**
 * 스토리지 키
 */
export const STORAGE_KEYS = {
  TOKEN: '@jeongchongmu_token',
  USER: '@jeongchongmu_user',
  THEME: '@jeongchongmu_theme',
  LANGUAGE: '@jeongchongmu_language',
  ONBOARDING_COMPLETE: '@jeongchongmu_onboarding_complete',
} as const;

/**
 * 페이지네이션 설정
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * 이미지 설정
 */
export const IMAGE_CONFIG = {
  /**
   * 업로드 가능한 최대 이미지 크기 (바이트)
   */
  MAX_SIZE: 10 * 1024 * 1024, // 10MB

  /**
   * 이미지 압축 품질 (0 ~ 1)
   */
  QUALITY: 0.8,

  /**
   * 허용되는 이미지 타입
   */
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
} as const;

/**
 * 알림 설정
 */
export const NOTIFICATION_CONFIG = {
  /**
   * 알림 폴링 간격 (밀리초)
   * 실시간 알림이 없을 경우 주기적으로 확인
   */
  POLLING_INTERVAL: 60000, // 1분

  /**
   * 알림 최대 표시 개수
   */
  MAX_DISPLAY_COUNT: 99, // "99+" 표시
} as const;

/**
 * 날짜/시간 설정
 */
export const DATE_CONFIG = {
  /**
   * 기본 날짜 포맷
   */
  DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',

  /**
   * 기본 시간 포맷
   */
  DEFAULT_TIME_FORMAT: 'HH:mm',

  /**
   * 날짜+시간 포맷
   */
  DEFAULT_DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',

  /**
   * 로케일
   */
  LOCALE: 'ko-KR',
} as const;

/**
 * 딥링크 설정
 */
export const DEEP_LINK_CONFIG = {
  /**
   * 앱 스킴
   */
  SCHEME: 'jeongchongmu://',

  /**
   * 토스 송금 딥링크 스킴
   */
  TOSS_SCHEME: 'supertoss://send',
} as const;

/**
 * 기타 UI 설정
 */
export const UI_CONFIG = {
  /**
   * 기본 애니메이션 지속 시간 (밀리초)
   */
  ANIMATION_DURATION: 300,

  /**
   * 스낵바/토스트 표시 시간 (밀리초)
   */
  TOAST_DURATION: 3000,

  /**
   * 버튼 터치 불투명도
   */
  ACTIVE_OPACITY: 0.7,

  /**
   * 기본 패딩
   */
  DEFAULT_PADDING: 16,

  /**
   * 기본 Border Radius
   */
  DEFAULT_BORDER_RADIUS: 8,
} as const;

/**
 * 모든 설정을 통합한 객체
 */
export const CONFIG = {
  API: API_CONFIG,
  APP: APP_INFO,
  ENV: ENVIRONMENT,
  STORAGE: STORAGE_KEYS,
  PAGINATION,
  IMAGE: IMAGE_CONFIG,
  NOTIFICATION: NOTIFICATION_CONFIG,
  DATE: DATE_CONFIG,
  DEEP_LINK: DEEP_LINK_CONFIG,
  UI: UI_CONFIG,

  // 자주 사용하는 설정 바로가기
  API_BASE_URL: API_CONFIG.BASE_URL,
  IS_DEV: ENVIRONMENT.IS_DEV,
  APP_VERSION: APP_INFO.VERSION,
} as const;

/**
 * 설정 타입 추출
 */
export type ConfigKey = keyof typeof CONFIG;
export type ApiConfigKey = keyof typeof API_CONFIG;
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
