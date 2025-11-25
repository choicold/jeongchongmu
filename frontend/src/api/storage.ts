import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_auth_token'; // 저장소에 저장될 키 이름

// 토큰 저장 (로그인 시)
export const saveToken = async (token: string) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        console.log('[SecureStore] Token saved');
    } catch (error) {
        console.error('[SecureStore] Error saving token:', error);
    }
};

// 토큰 가져오기 (앱 실행 시 자동 로그인 체크용)
export const getToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('[SecureStore] Error getting token:', error);
        return null;
    }
};

// 토큰 삭제 (로그아웃 시)
export const removeToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        console.log('[SecureStore] Token removed');
    } catch (error) {
        console.error('[SecureStore] Error removing token:', error);
    }
};