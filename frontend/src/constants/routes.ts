/**
 * 라우트 이름 상수
 * 네비게이션 사용 시 문자열 오타를 방지하고 타입 안정성을 제공합니다.
 *
 * @example
 * ```tsx
 * import { ROUTES } from '../constants/routes';
 *
 * // 사용 예시
 * navigation.navigate(ROUTES.AUTH.LOGIN);
 * navigation.navigate(ROUTES.GROUPS.GROUP_DETAIL, { groupId: 1 });
 * ```
 */

/**
 * 인증 관련 라우트
 */
export const AUTH_ROUTES = {
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
} as const;

/**
 * 그룹 관련 라우트
 */
export const GROUP_ROUTES = {
  GROUP_LIST: 'GroupList',
  GROUP_DETAIL: 'GroupDetail',
  CREATE_GROUP: 'CreateGroup',
  JOIN_GROUP: 'JoinGroup',
} as const;

/**
 * 지출 관련 라우트
 */
export const EXPENSE_ROUTES = {
  EXPENSE_LIST: 'ExpenseList',
  EXPENSE_DETAIL: 'ExpenseDetail',
  CREATE_EXPENSE: 'CreateExpense',
  EDIT_EXPENSE: 'EditExpense',
  OCR_SCAN: 'OCRScan',
} as const;

/**
 * 정산 관련 라우트
 */
export const SETTLEMENT_ROUTES = {
  CREATE_SETTLEMENT: 'CreateSettlement',
  SETTLEMENT_DETAIL: 'SettlementDetail',
  VOTE: 'Vote',
} as const;

/**
 * 통계 관련 라우트
 */
export const STATISTICS_ROUTES = {
  STATISTICS: 'Statistics',
} as const;

/**
 * 알림 관련 라우트
 */
export const NOTIFICATION_ROUTES = {
  NOTIFICATION_LIST: 'NotificationList',
} as const;

/**
 * 프로필 관련 라우트
 */
export const PROFILE_ROUTES = {
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
} as const;

/**
 * 메인(홈) 화면 라우트
 */
export const MAIN_ROUTES = {
  MAIN: 'Main',
} as const;

/**
 * 메인 탭 라우트
 */
export const TAB_ROUTES = {
  MAIN_TAB: 'MainTab',
  GROUPS_TAB: 'GroupsTab',
  STATISTICS_TAB: 'StatisticsTab',
  NOTIFICATIONS_TAB: 'NotificationsTab',
  PROFILE_TAB: 'ProfileTab',
} as const;

/**
 * 모든 라우트를 통합한 객체
 */
export const ROUTES = {
  AUTH: AUTH_ROUTES,
  MAIN: MAIN_ROUTES,
  GROUPS: GROUP_ROUTES,
  EXPENSES: EXPENSE_ROUTES,
  SETTLEMENTS: SETTLEMENT_ROUTES,
  STATISTICS: STATISTICS_ROUTES,
  NOTIFICATIONS: NOTIFICATION_ROUTES,
  PROFILE: PROFILE_ROUTES,
  TABS: TAB_ROUTES,
} as const;

/**
 * 라우트 타입 추출 (필요 시 사용)
 */
export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
export type MainRoute = (typeof MAIN_ROUTES)[keyof typeof MAIN_ROUTES];
export type GroupRoute = (typeof GROUP_ROUTES)[keyof typeof GROUP_ROUTES];
export type ExpenseRoute = (typeof EXPENSE_ROUTES)[keyof typeof EXPENSE_ROUTES];
export type SettlementRoute = (typeof SETTLEMENT_ROUTES)[keyof typeof SETTLEMENT_ROUTES];
export type StatisticsRoute = (typeof STATISTICS_ROUTES)[keyof typeof STATISTICS_ROUTES];
export type NotificationRoute = (typeof NOTIFICATION_ROUTES)[keyof typeof NOTIFICATION_ROUTES];
export type ProfileRoute = (typeof PROFILE_ROUTES)[keyof typeof PROFILE_ROUTES];
export type TabRoute = (typeof TAB_ROUTES)[keyof typeof TAB_ROUTES];
