import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 토큰 저장을 위한 키
 */
const TOKEN_KEY = '@jeongchongmu_token';

/**
 * Bearer 토큰을 AsyncStorage에 저장합니다.
 *
 * @param token - 저장할 토큰 문자열
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await saveToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * ```
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    throw error;
  }
};

/**
 * AsyncStorage에서 저장된 토큰을 가져옵니다.
 *
 * @returns Promise<string | null> - 저장된 토큰 또는 null
 *
 * @example
 * ```typescript
 * const token = await getToken();
 * if (token) {
 *   console.log('토큰 존재');
 * }
 * ```
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('토큰 조회 실패:', error);
    return null;
  }
};

/**
 * AsyncStorage에서 토큰을 삭제합니다.
 * 로그아웃 시 사용됩니다.
 *
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await removeToken();
 * console.log('로그아웃 완료');
 * ```
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
    throw error;
  }
};
