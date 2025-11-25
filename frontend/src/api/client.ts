// src/api/client.ts

// [중요] 사용하는 환경에 맞춰 주석을 해제하세요!
// 1. 안드로이드 에뮬레이터 사용 시:
export const BASE_URL = 'http://210.90.179.28:8080';
/**
 * 기본 API 클라이언트 함수.
 * @param endpoint 요청할 API 엔드포인트 경로 (예: '/api/groups')
 * @param method HTTP 메소드 (예: 'GET', 'POST', 'PUT', 'DELETE')
 * @param body 요청 본문에 포함할 데이터 (POST/PUT용)
 * @param token 인증 토큰 (Bearer Token)
 */
export const apiClient = async (endpoint: string, method: string, body: any = null, token: string | null = null, isMultipart: boolean = false) => {
    const url = `${BASE_URL}${endpoint}`;

    // [수정] Multipart 요청일 경우 Content-Type 헤더를 자동으로 설정하도록 headers 객체 조정
    const headers: any = {};
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: any = { method, headers };

    if (body) {
        config.body = isMultipart ? body : JSON.stringify(body);
    }

    console.log(`[API Request] ${method} ${url}`);

    try {
        const response = await fetch(url, config);
        const textData = await response.text();

        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            data = textData;
        }

        if (!response.ok) {
            const errorMsg = typeof data === 'object' && data.message ? data.message : data;
            throw new Error(errorMsg || `요청 실패 (${response.status})`);
        }

        return data;
    } catch (error: any) {
        console.error("[API Error Details]:", error);
        if (error.message.includes('Network request failed')) {
            throw new Error("서버에 연결할 수 없습니다.\nIP 주소와 와이파이 연결을 확인해주세요.");
        }
        throw error;
    }
};

// --- Mock Data ---
export const INITIAL_MOCK_GROUPS = [
    { id: 101, name: "주말 한강 라이딩", description: "매주 토요일 라이딩 모임", memberCount: 5, creator: { name: "자전거왕" }, createdAt: "2025-11-25T12:00:00.000Z" },
    { id: 102, name: "강남 점심 맛집", description: "직장인 점심 해결 팟", memberCount: 12, creator: { name: "맛잘알" }, createdAt: "2025-11-24T10:00:00.000Z" },
    { id: 103, name: "오래된 독서 모임", description: "고전 책 읽기", memberCount: 4, creator: { name: "책벌레" }, createdAt: "2025-11-01T09:00:00.000Z" },
];

export const MOCK_MEMBERS: any = {
    101: [
        { id: 1, name: "자전거왕", role: "admin", color: "#DBEAFE", textColor: "#1E40AF" },
        { id: 2, name: "김철수", role: "member", color: "#DCFCE7", textColor: "#166534" },
    ]
};

export const MOCK_EXPENSES: any = {
    101: [
        { id: 1, title: "편의점 간식", amount: 15000, payerName: "자전거왕", expenseData: "2025-11-24T10:30:00", category: "식비" },
    ]
};

// --- API 함수 모음 ---
export const api = {
    // 인증
    signup: (userData: any) => apiClient('/api/user/signup', 'POST', userData),
    login: (credentials: any) => apiClient('/api/user/login', 'POST', credentials),

    // 그룹
    getGroups: (token: any) => apiClient('/api/groups', 'GET', null, token),
    createGroup: (data: any, token: any) => apiClient('/api/groups', 'POST', data, token),
    getGroupDetail: (token: string, groupId: number) => apiClient(`/api/groups/${groupId}`, 'GET', null, token),
    getGroupMembers: (token: string, groupId: number) => apiClient(`/api/groups/${groupId}/members`, 'GET', null, token),

    // 지출
    getExpenses: (token: string, groupId: number) => apiClient(`/api/expenses?groupId=${groupId}`, 'GET', null, token),
    getExpenseDetail: (token: string, expenseId: number) => apiClient(`/api/expenses/${expenseId}`, 'GET', null, token),

    // [추가] 지출 등록 (최종)
    createExpense: (token: string, expenseData: any) => apiClient('/api/expenses', 'POST', expenseData, token),

    // [추가] 영수증 OCR 스캔 (Multipart)
    uploadReceipt: (token: string, formData: FormData) =>
        apiClient('/api/ocr/scan', 'POST', formData, token, true),

    // 통계
    getStatistics: (token: string, groupId: number, year: number, month: number) => {
        const endpoint = `/api/groups/${groupId}/statistics?year=${year}&month=${month}`;
        return apiClient(endpoint, 'GET', null, token);
    },
};