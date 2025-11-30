# 정총무 - API 엔드포인트 매핑

본 문서는 백엔드 API 엔드포인트와 프론트엔드 서비스 함수의 매핑 정보를 제공합니다.

---

## 📋 목차

1. [인증 API](#1-인증-api)
2. [그룹 API](#2-그룹-api)
3. [그룹 멤버 API](#3-그룹-멤버-api)
4. [지출 API](#4-지출-api)
5. [OCR API](#5-ocr-api)
6. [정산 API](#6-정산-api)
7. [투표 API](#7-투표-api)
8. [통계 API](#8-통계-api)
9. [알림 API](#9-알림-api)

---

## 1. 인증 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/user/signup` | 회원가입 | `authApi.signUp()` | `SignUpRequestDto` | `"회원가입이 완료되었습니다."` |
| POST | `/api/user/login` | 로그인 | `authApi.login()` | `LoginRequestDto` | `LoginResponseDto` (토큰) |

**타입 정의**:
```typescript
// src/types/auth.types.ts
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  bankName: string;
  accountNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  bearerToken: string;
}
```

---

## 2. 그룹 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/groups` | 그룹 생성 | `groupApi.createGroup()` | `GroupRequest` | `GroupDto` |
| GET | `/api/groups` | 내 그룹 목록 조회 | `groupApi.getMyGroups()` | - | `GroupDto[]` |
| GET | `/api/groups/{groupId}` | 그룹 상세 조회 | `groupApi.getGroupDetail()` | - | `GroupDto` |
| PUT | `/api/groups/{groupId}` | 그룹 수정 (OWNER만) | `groupApi.updateGroup()` | `GroupRequest` | `GroupDto` |
| DELETE | `/api/groups/{groupId}` | 그룹 삭제 (OWNER만) | `groupApi.deleteGroup()` | - | - |
| POST | `/api/groups/{groupId}/invite-code` | 초대 코드 재생성 | `groupApi.regenerateInviteCode()` | - | `GroupDto` |

**타입 정의**:
```typescript
// src/types/group.types.ts
export interface GroupRequest {
  name: string;
  description?: string;
}

export interface GroupDto {
  id: number;
  name: string;
  description?: string;
  inviteCode: string;
  inviteLink: string;
  creator: UserSummaryDto;
  memberCount: number;
  createdAt: string;
}

export interface UserSummaryDto {
  id: number;
  name: string;
}
```

---

## 3. 그룹 멤버 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/groups/join` | 초대 코드로 그룹 참여 | `groupMemberApi.joinGroup()` | `JoinGroupByCodeRequest` | `GroupMemberDto` |
| GET | `/api/groups/{groupId}/members` | 그룹 멤버 목록 조회 | `groupMemberApi.getGroupMembers()` | - | `GroupMemberDto[]` |
| GET | `/api/groups/{groupId}/members/{memberId}` | 특정 멤버 조회 | `groupMemberApi.getGroupMember()` | - | `GroupMemberDto` |
| DELETE | `/api/groups/{groupId}/members/{targetUserId}` | 멤버 강제 퇴출 (OWNER만) | `groupMemberApi.removeMember()` | - | - |
| DELETE | `/api/groups/{groupId}/leave` | 스스로 그룹 탈퇴 | `groupMemberApi.leaveGroup()` | - | - |

**타입 정의**:
```typescript
// src/types/group.types.ts
export interface JoinGroupByCodeRequest {
  inviteCode: string;
}

export interface GroupMemberDto {
  id: number;
  user: UserSummaryDto;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}
```

---

## 4. 지출 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/expenses` | 지출 생성 | `expenseApi.createExpense()` | `ExpenseCreateDTO` | `ExpenseDetailDTO` |
| GET | `/api/expenses?groupId={id}` | 그룹별 지출 목록 조회 | `expenseApi.getExpensesByGroup()` | - | `ExpenseSimpleDTO[]` |
| GET | `/api/expenses/{id}` | 지출 상세 조회 | `expenseApi.getExpenseDetail()` | - | `ExpenseDetailDTO` |
| PATCH | `/api/expenses/{id}` | 지출 수정 | `expenseApi.updateExpense()` | `ExpenseUpdateDTO` | - |
| DELETE | `/api/expenses/{id}` | 지출 삭제 | `expenseApi.deleteExpense()` | - | - |

**타입 정의**:
```typescript
// src/types/expense.types.ts
export interface ExpenseCreateDTO {
  title: string;
  amount: number;
  expenseData: string; // ISO 8601 format
  groupId: number;
  participantIds: number[];
  items: ExpenseItemDTO[];
  tagNames: string[];
  receiptUrl?: string;
}

export interface ExpenseItemDTO {
  name: string;
  price: number;
  quantity: number;
}

export interface ExpenseSimpleDTO {
  id: number;
  title: string;
  amount: number;
  payerName: string;
  expenseData: string;
}

export interface ExpenseDetailDTO {
  id: number;
  title: string;
  amount: number;
  expenseData: string;
  receiptUrl?: string;
  payerName: string;
  groupId: number;
  items: ExpenseItemDTO[];
  participants: string[]; // 참여자 이름 배열
  tagNames: string[];
}

export interface ExpenseUpdateDTO {
  title?: string;
  amount?: number;
  expenseData?: string;
  participantIds?: number[];
  items?: ExpenseItemDTO[];
  tagNames?: string[];
}
```

---

## 5. OCR API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/ocr/scan` | 영수증 OCR 스캔 | `ocrApi.scan()` | `FormData` (이미지 파일) | `OcrResultDTO` |

**타입 정의**:
```typescript
// src/types/ocr.types.ts
export interface OcrResultDTO {
  title: string;
  amount: number;
  expenseData: string;
  items: ExpenseItemDTO[];
}
```

**구현 예시**:
```typescript
// src/services/api/ocrApi.ts
import apiClient from './apiClient';
import { OcrResultDTO } from '../../types/ocr.types';

export const scan = async (imageUri: string): Promise<OcrResultDTO> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  } as any);

  const response = await apiClient.post<OcrResultDTO>('/api/ocr/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

---

## 6. 정산 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/settlements` | 정산 생성 | `settlementApi.createSettlement()` | `SettlementCreateRequest` | `SettlementResponse` |

**타입 정의**:
```typescript
// src/types/settlement.types.ts
export type SettlementMethod = 'N_BUN_1' | 'DIRECT' | 'PERCENT' | 'ITEM';

export interface DirectSettlementEntry {
  userId: number;
  amount: number;
}

export interface PercentSettlementEntry {
  userId: number;
  ratio: number; // 퍼센트 (예: 60.5)
}

export interface SettlementCreateRequest {
  expenseId: number;
  method: SettlementMethod;
  participantUserIds: number[];
  directEntries?: DirectSettlementEntry[];
  percentEntries?: PercentSettlementEntry[];
}

export interface SettlementResponse {
  settlementId: number;
  expenseId: number;
  method: SettlementMethod;
  status: 'PENDING' | 'COMPLETED';
  totalAmount: number;
  details: SettlementDetailDto[];
}

export interface SettlementDetailDto {
  debtorId: number;
  debtorName: string;
  creditorId: number;
  creditorName: string;
  amount: number;
  isSent: boolean;
  creditorBankName?: string;
  creditorAccountNumber?: string;
  transferUrl?: string; // 토스 딥링크
}
```

---

## 7. 투표 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| POST | `/api/votes/{expenseId}` | 투표 생성 | `voteApi.createVote()` | - | `number` (voteId) |
| POST | `/api/votes/cast` | 투표하기 | `voteApi.castVote()` | `CastVoteRequest` | `"투표 반영 완료"` |
| GET | `/api/votes/{expenseId}` | 투표 현황 조회 | `voteApi.getVoteStatus()` | - | `VoteResponse` |

**타입 정의**:
```typescript
// src/types/vote.types.ts
export interface CastVoteRequest {
  userId: number;
  optionId: number;
}

export interface VoteResponse {
  voteId: number;
  expenseId: number;
  isClosed: boolean;
  options: VoteOptionDto[];
}

export interface VoteOptionDto {
  optionId: number;
  itemName: string;
  price: number;
  votedUserIds: number[];
}
```

---

## 8. 통계 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| GET | `/api/groups/{groupId}/statistics?year={year}&month={month}` | 월별 통계 조회 | `statisticsApi.getMonthlyStatistics()` | - | `MonthlyStatisticsResponseDto` |

**타입 정의**:
```typescript
// src/types/statistics.types.ts
export interface MonthlyStatisticsResponseDto {
  totalExpenseAmount: number;
  totalExpenseCount: number;
  categories: CategorySummaryDto[];
  topExpense?: TopExpenseDto;
  totalSettlementCount: number;
  notCompletedSettlementCount: number;
  incompletedSettlements: TopExpenseDto[];
  yearlyStatistics: number[]; // 1~12월 지출 금액 배열
}

export interface CategorySummaryDto {
  tagName: string;
  totalAmount: number;
}

export interface TopExpenseDto {
  id: number;
  title: string;
  amount: number;
}
```

---

## 9. 알림 API

| HTTP Method | 엔드포인트 | 설명 | 프론트엔드 함수 | Request Body | Response |
|-------------|-----------|------|----------------|-------------|----------|
| GET | `/api/notifications` | 알림 목록 조회 | `notificationApi.getNotifications()` | - | `NotificationDto[]` |
| PATCH | `/api/notifications/{notificationId}/read` | 알림 읽음 처리 | `notificationApi.markAsRead()` | - | - |

**타입 정의**:
```typescript
// src/types/notification.types.ts
export interface NotificationDto {
  id: number;
  type: 'SETTLEMENT_REQUEST' | 'SETTLEMENT_REMINDER' | 'VOTE_CREATED' | 'VOTE_CLOSE' | 'EXPENSE_ADDED' | 'GROUP_INVITE';
  content: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}
```

---

## 10. 공통 헤더 설정

모든 API 호출에는 다음 헤더가 포함되어야 합니다:
```typescript
// src/services/api/apiClient.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // 실제 배포 시 환경 변수로 관리
  timeout: 10000,
});

// 요청 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // 로그인 화면으로 리다이렉트 (네비게이션 로직 추가 필요)
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 11. 환경 변수 설정

`app.config.js`에서 API URL을 환경 변수로 관리하세요:
```javascript
// app.config.js
export default {
  expo: {
    // ...
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080"
    }
  }
};
```

프론트엔드에서 사용:
```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';
```

---

## ✅ 다음 단계

1. 각 API 함수를 `src/services/api/` 폴더에 구현하세요.
2. 타입 정의를 `src/types/` 폴더에 작성하세요.
3. 화면에서 API 함수를 호출하여 데이터를 표시하세요.