/**
 * 컬러 팔레트
 * 앱 전체에서 일관된 색상을 사용하기 위한 컬러 상수입니다.
 *
 * @example
 * ```tsx
 * import { COLORS } from '../constants/colors';
 *
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: COLORS.primary,
 *   },
 *   text: {
 *     color: COLORS.text.primary,
 *   },
 * });
 * ```
 */

/**
 * Primary 색상 (브랜드 메인 컬러) - Emerald Green
 */
export const PRIMARY_COLORS = {
  main: '#10B981', // Emerald 500
  light: '#34D399', // Emerald 400
  dark: '#059669', // Emerald 600
  contrast: '#FFFFFF', // Primary 위의 텍스트 색상
} as const;

/**
 * Secondary 색상 (보조 컬러)
 */
export const SECONDARY_COLORS = {
  main: '#5856D6', // iOS 보라색
  light: '#AF52DE',
  dark: '#3634A3',
  contrast: '#FFFFFF',
} as const;

/**
 * 배경 색상
 */
export const BACKGROUND_COLORS = {
  default: '#FFFFFF',
  secondary: '#F8FAFC', // Slate 50
  tertiary: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  modal: 'rgba(0, 0, 0, 0.5)', // 모달 배경
  input: '#F8FAFC', // Slate 50 - Input 배경
} as const;

/**
 * 텍스트 색상
 */
export const TEXT_COLORS = {
  primary: '#1E293B', // Slate 800
  secondary: '#64748B', // Slate 500
  tertiary: '#94A3B8', // Slate 400
  disabled: '#CBD5E1', // Slate 300
  placeholder: '#94A3B8', // Slate 400
  inverse: '#FFFFFF', // 어두운 배경 위의 텍스트
} as const;

/**
 * 시스템 색상 (상태 표시)
 */
export const SYSTEM_COLORS = {
  success: '#34C759', // iOS 초록색
  error: '#FF3B30', // iOS 빨간색
  warning: '#FF9500', // iOS 오렌지색
  info: '#007AFF', // iOS 파란색
} as const;

/**
 * Border 색상
 */
export const BORDER_COLORS = {
  default: '#E2E8F0', // Slate 200
  light: '#F1F5F9', // Slate 100
  dark: '#94A3B8', // Slate 400
  focus: '#10B981', // Emerald 500
} as const;

/**
 * 기타 UI 색상
 */
export const UI_COLORS = {
  divider: '#C6C6C8',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  disabled: '#E5E5EA',
  link: '#007AFF',
} as const;

/**
 * 태그/뱃지 색상
 */
export const TAG_COLORS = {
  food: '#FF9500', // 식비
  transport: '#5AC8FA', // 교통
  accommodation: '#AF52DE', // 숙박
  entertainment: '#FF2D55', // 오락
  shopping: '#FFD60A', // 쇼핑
  etc: '#8E8E93', // 기타
} as const;

/**
 * 차트 색상 (통계 화면용)
 */
export const CHART_COLORS = [
  '#007AFF', // 파란색
  '#34C759', // 초록색
  '#FF9500', // 오렌지색
  '#AF52DE', // 보라색
  '#FF2D55', // 핑크색
  '#5AC8FA', // 하늘색
  '#FFD60A', // 노란색
  '#BF5AF2', // 연보라색
] as const;

/**
 * 모든 색상을 통합한 객체
 */
export const COLORS = {
  primary: PRIMARY_COLORS.main,
  primaryLight: PRIMARY_COLORS.light,
  primaryDark: PRIMARY_COLORS.dark,

  secondary: SECONDARY_COLORS.main,
  secondaryLight: SECONDARY_COLORS.light,
  secondaryDark: SECONDARY_COLORS.dark,

  background: BACKGROUND_COLORS,
  text: TEXT_COLORS,
  system: SYSTEM_COLORS,
  border: BORDER_COLORS,
  ui: UI_COLORS,
  tag: TAG_COLORS,
  chart: CHART_COLORS,

  // 자주 사용하는 색상 바로가기
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // 시스템 색상 바로가기
  success: SYSTEM_COLORS.success,
  error: SYSTEM_COLORS.error,
  warning: SYSTEM_COLORS.warning,
  info: SYSTEM_COLORS.info,
} as const;

/**
 * 다크 모드 색상 (추후 구현 예정)
 */
export const DARK_COLORS = {
  // TODO: 다크 모드 지원 시 구현
  primary: '#0A84FF',
  background: {
    default: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#EBEBF5',
  },
  // ... 나머지 다크 모드 색상
} as const;

/**
 * 색상 타입 추출
 */
export type ColorKey = keyof typeof COLORS;
export type PrimaryColor = keyof typeof PRIMARY_COLORS;
export type SystemColor = keyof typeof SYSTEM_COLORS;
