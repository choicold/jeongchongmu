# 정총무 프론트엔드 - 디렉토리 구조

## 📁 전체 폴더 트리
```
frontend/
├── assets/                          # 정적 리소스
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
├── src/
│   ├── navigation/                  # 내비게이션 설정
│   │   ├── AppNavigator.tsx        # 루트 네비게이터 (로그인 여부에 따른 분기)
│   │   ├── AuthNavigator.tsx       # 인증 관련 스택 (로그인, 회원가입)
│   │   └── MainNavigator.tsx       # 메인 앱 스택 (그룹, 지출, 정산 등)
│   │
│   ├── screens/                     # 화면 컴포넌트
│   │   ├── auth/                   # 인증 관련 화면
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignUpScreen.tsx
│   │   │
│   │   ├── group/                  # 그룹 관련 화면
│   │   │   ├── GroupListScreen.tsx          # 내 그룹 목록
│   │   │   ├── GroupDetailScreen.tsx        # 그룹 상세 (멤버, 지출 요약)
│   │   │   ├── CreateGroupScreen.tsx        # 그룹 생성
│   │   │   └── JoinGroupScreen.tsx          # 초대 코드로 그룹 참여
│   │   │
│   │   ├── expense/                # 지출 관련 화면
│   │   │   ├── ExpenseListScreen.tsx        # 그룹별 지출 목록
│   │   │   ├── ExpenseDetailScreen.tsx      # 지출 상세 조회
│   │   │   ├── CreateExpenseScreen.tsx      # 지출 등록 (수동 입력)
│   │   │   ├── OCRScanScreen.tsx            # 영수증 OCR 스캔
│   │   │   └── EditExpenseScreen.tsx        # 지출 수정
│   │   │
│   │   ├── settlement/             # 정산 관련 화면
│   │   │   ├── CreateSettlementScreen.tsx   # 정산 생성 (방식 선택)
│   │   │   ├── SettlementDetailScreen.tsx   # 정산 결과 조회
│   │   │   └── VoteScreen.tsx               # 항목별 정산 투표
│   │   │
│   │   ├── statistics/             # 통계 화면
│   │   │   └── StatisticsScreen.tsx         # 월별/연간 지출 통계
│   │   │
│   │   └── notification/           # 알림 화면
│   │       └── NotificationListScreen.tsx   # 알림 목록
│   │
│   ├── components/                  # 재사용 가능한 UI 컴포넌트
│   │   ├── common/                 # 공통 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   │
│   │   ├── expense/                # 지출 관련 컴포넌트
│   │   │   ├── ExpenseCard.tsx              # 지출 항목 카드
│   │   │   ├── ExpenseItemList.tsx          # 지출 세부 항목 리스트
│   │   │   └── TagSelector.tsx              # 태그 선택 컴포넌트
│   │   │
│   │   ├── settlement/             # 정산 관련 컴포넌트
│   │   │   ├── SettlementMethodSelector.tsx # 정산 방식 선택
│   │   │   ├── SettlementDetailCard.tsx     # 정산 내역 카드 (누가 누구에게)
│   │   │   └── VoteOptionCard.tsx           # 투표 선택지 카드
│   │   │
│   │   └── statistics/             # 통계 관련 컴포넌트
│   │       ├── MonthlyChart.tsx             # 월별 차트
│   │       └── CategoryPieChart.tsx         # 카테고리별 파이 차트
│   │
│   ├── services/                    # API 통신 및 비즈니스 로직
│   │   ├── api/                    # API 클라이언트 및 엔드포인트
│   │   │   ├── apiClient.ts                 # Axios 인스턴스 (헤더, 인터셉터)
│   │   │   ├── authApi.ts                   # 인증 API (로그인, 회원가입)
│   │   │   ├── groupApi.ts                  # 그룹 API (생성, 조회, 수정, 삭제)
│   │   │   ├── groupMemberApi.ts            # 그룹 멤버 API (참여, 탈퇴)
│   │   │   ├── expenseApi.ts                # 지출 API (CRUD)
│   │   │   ├── ocrApi.ts                    # OCR API (영수증 스캔)
│   │   │   ├── settlementApi.ts             # 정산 API (생성, 조회)
│   │   │   ├── voteApi.ts                   # 투표 API (생성, 투표, 조회)
│   │   │   ├── statisticsApi.ts             # 통계 API (월별, 연간)
│   │   │   └── notificationApi.ts           # 알림 API (조회, 읽음 처리)
│   │   │
│   │   ├── OCRService.ts           # OCR 처리 로직 (카메라 → 서버 → 파싱)
│   │   ├── AIChatService.ts        # AI 채팅 인터페이스 (추후 MCP 연동 예정)
│   │   └── DeepLinkService.ts      # 딥링크 처리 (토스 송금 등)
│   │
│   ├── hooks/                       # 커스텀 훅
│   │   ├── useAuth.ts              # 인증 상태 관리
│   │   ├── useGroups.ts            # 그룹 데이터 관리
│   │   └── useExpenses.ts          # 지출 데이터 관리
│   │
│   ├── context/                     # Context API (전역 상태)
│   │   ├── AuthContext.tsx         # 인증 컨텍스트 (토큰, 유저 정보)
│   │   └── NotificationContext.tsx # 알림 컨텍스트 (미읽음 알림 카운트)
│   │
│   ├── types/                       # TypeScript 타입 정의
│   │   ├── auth.types.ts
│   │   ├── group.types.ts
│   │   ├── expense.types.ts
│   │   ├── settlement.types.ts
│   │   ├── vote.types.ts
│   │   ├── statistics.types.ts
│   │   └── notification.types.ts
│   │
│   ├── utils/                       # 유틸리티 함수
│   │   ├── storage.ts              # AsyncStorage 래퍼 (토큰 저장 등)
│   │   ├── dateFormatter.ts        # 날짜 포맷 함수
│   │   └── validation.ts           # 입력 검증 함수
│   │
│   └── constants/                   # 상수 정의
│       ├── colors.ts               # 컬러 팔레트
│       ├── routes.ts               # 라우트 이름 상수
│       └── config.ts               # 앱 설정값
│
├── App.tsx                          # 앱 진입점
├── app.config.js                    # Expo 설정
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📂 주요 폴더별 역할 설명

### **1. `src/navigation/`**
앱의 화면 전환 흐름을 관리하는 네비게이터들을 정의합니다.

- **AppNavigator.tsx**: 
  - 루트 네비게이터로, 사용자가 로그인했는지 여부에 따라 `AuthNavigator` 또는 `MainNavigator`로 분기합니다.
  - `AuthContext`를 통해 토큰 유무를 확인합니다.

- **AuthNavigator.tsx**: 
  - 로그인(`LoginScreen`) 및 회원가입(`SignUpScreen`) 화면을 포함하는 스택 네비게이터입니다.

- **MainNavigator.tsx**: 
  - 로그인 후 사용할 수 있는 메인 앱의 네비게이터입니다.
  - 탭 네비게이터 또는 드로어 네비게이터를 사용할 수 있으며, 주요 탭은 다음과 같습니다:
    - **그룹 탭**: 그룹 목록 → 그룹 상세 → 지출 목록
    - **통계 탭**: 월별/연간 통계 차트
    - **알림 탭**: 알림 목록

---

### **2. `src/screens/`**
각 기능별 화면 컴포넌트를 정의합니다. 화면은 기능에 따라 하위 폴더로 분류됩니다.

#### **`auth/`** - 인증 관련
- `LoginScreen.tsx`: 이메일/비밀번호 로그인
- `SignUpScreen.tsx`: 회원가입 (이메일, 비밀번호, 이름, 은행명, 계좌번호)

#### **`group/`** - 그룹 관련
- `GroupListScreen.tsx`: 내가 속한 그룹 목록 표시
- `GroupDetailScreen.tsx`: 그룹 상세 정보 (멤버 목록, 지출 요약, 초대 코드)
- `CreateGroupScreen.tsx`: 새 그룹 생성 폼
- `JoinGroupScreen.tsx`: 초대 코드 입력하여 그룹 참여

#### **`expense/`** - 지출 관련
- `ExpenseListScreen.tsx`: 특정 그룹의 지출 내역 리스트
- `ExpenseDetailScreen.tsx`: 지출 상세 정보 (항목, 참여자, 태그)
- `CreateExpenseScreen.tsx`: 지출 수동 등록 폼
- `OCRScanScreen.tsx`: 카메라로 영수증 촬영 → OCR 결과를 받아 폼에 자동 입력
- `EditExpenseScreen.tsx`: 기존 지출 수정

#### **`settlement/`** - 정산 관련
- `CreateSettlementScreen.tsx`: 정산 생성 (N분의 1, 직접, 퍼센트, 항목별 선택)
- `SettlementDetailScreen.tsx`: 정산 결과 조회 (누가 누구에게 얼마 보낼지, 송금 링크)
- `VoteScreen.tsx`: 항목별 정산 시 메뉴 투표 화면

#### **`statistics/`** - 통계
- `StatisticsScreen.tsx`: 그룹별 월간/연간 지출 통계 및 차트

#### **`notification/`** - 알림
- `NotificationListScreen.tsx`: 알림 목록 및 읽음 처리

---

### **3. `src/components/`**
재사용 가능한 UI 컴포넌트를 정의합니다.

#### **`common/`** - 공통 컴포넌트
- `Button.tsx`: 커스텀 버튼 (Primary, Secondary 스타일)
- `Input.tsx`: 커스텀 텍스트 인풋
- `Card.tsx`: 카드 레이아웃
- `LoadingSpinner.tsx`: 로딩 인디케이터
- `ErrorMessage.tsx`: 에러 메시지 표시

#### **`expense/`** - 지출 관련
- `ExpenseCard.tsx`: 지출 항목을 카드 형태로 표시 (제목, 금액, 지불자)
- `ExpenseItemList.tsx`: 지출 세부 항목 리스트 (품목, 가격, 수량)
- `TagSelector.tsx`: 태그 선택 UI (태그 버튼 리스트)

#### **`settlement/`** - 정산 관련
- `SettlementMethodSelector.tsx`: 정산 방식 선택 (라디오 버튼 또는 카드 선택)
- `SettlementDetailCard.tsx`: "A → B: 10,000원" 형태의 정산 내역 카드
- `VoteOptionCard.tsx`: 투표 선택지 (메뉴명, 가격, 선택한 사람들)

#### **`statistics/`** - 통계 관련
- `MonthlyChart.tsx`: 월별 지출 라인 차트 (react-native-chart-kit 사용)
- `CategoryPieChart.tsx`: 카테고리별 파이 차트

---

### **4. `src/services/`**
API 통신 및 비즈니스 로직을 담당하는 서비스 레이어입니다.

#### **`api/`** - API 클라이언트
모든 API 호출 함수를 정의합니다. 각 파일은 백엔드의 컨트롤러와 1:1 매핑됩니다.

- **apiClient.ts**: 
  - Axios 인스턴스를 생성하고, 공통 헤더(Authorization Bearer 토큰) 및 인터셉터를 설정합니다.
  - 에러 처리 로직도 여기서 중앙화합니다.

- **authApi.ts**: 
  - `POST /api/user/signup` - 회원가입
  - `POST /api/user/login` - 로그인 (토큰 반환)

- **groupApi.ts**: 
  - `POST /api/groups` - 그룹 생성
  - `GET /api/groups` - 내 그룹 목록 조회
  - `GET /api/groups/{groupId}` - 그룹 상세 조회
  - `PUT /api/groups/{groupId}` - 그룹 수정
  - `DELETE /api/groups/{groupId}` - 그룹 삭제
  - `POST /api/groups/{groupId}/invite-code` - 초대 코드 재생성

- **groupMemberApi.ts**: 
  - `POST /api/groups/join` - 초대 코드로 그룹 참여
  - `GET /api/groups/{groupId}/members` - 그룹 멤버 목록
  - `DELETE /api/groups/{groupId}/members/{targetUserId}` - 멤버 강제 퇴출 (OWNER만)
  - `DELETE /api/groups/{groupId}/leave` - 스스로 그룹 탈퇴

- **expenseApi.ts**: 
  - `POST /api/expenses` - 지출 생성
  - `GET /api/expenses?groupId={id}` - 그룹별 지출 목록
  - `GET /api/expenses/{id}` - 지출 상세 조회
  - `PATCH /api/expenses/{id}` - 지출 수정
  - `DELETE /api/expenses/{id}` - 지출 삭제

- **ocrApi.ts**: 
  - `POST /api/ocr/scan` - 영수증 이미지 업로드 및 OCR 결과 반환

- **settlementApi.ts**: 
  - `POST /api/settlements` - 정산 생성
  - `GET /api/settlements/{settlementId}` - 정산 결과 조회 (추후 구현 예정)

- **voteApi.ts**: 
  - `POST /api/votes/{expenseId}` - 투표 생성
  - `POST /api/votes/cast` - 투표하기
  - `GET /api/votes/{expenseId}` - 투표 현황 조회

- **statisticsApi.ts**: 
  - `GET /api/groups/{groupId}/statistics?year={year}&month={month}` - 월별 통계

- **notificationApi.ts**: 
  - `GET /api/notifications` - 알림 목록 조회
  - `PATCH /api/notifications/{notificationId}/read` - 알림 읽음 처리

#### **비즈니스 로직 서비스**
- **OCRService.ts**: 
  - 카메라 API(expo-image-picker)를 사용하여 이미지를 촬영하고, `ocrApi.ts`를 호출하여 서버로 전송합니다.
  - 서버로부터 받은 JSON 데이터를 파싱하여 지출 등록 폼에 자동으로 채워줍니다.
  - 예: `{ title, amount, items: [{ name, price, quantity }] }` → 폼 상태로 변환

- **AIChatService.ts**: 
  - **현재는 인터페이스만 정의** (추후 MCP 서버 연동 예정)
  - 자연어 명령("제주도 여행 그룹에 회식비 5만원 추가해줘")을 처리할 예정
  - 주석: "AI 서버와의 통신 로직은 추후 백엔드 MCP 컨트롤러 완성 후 구현"

- **DeepLinkService.ts**: 
  - 토스(Toss) 송금 딥링크(`supertoss://send?...`)를 열어주는 함수
  - React Native의 `Linking` API를 사용

---

### **5. `src/hooks/`**
커스텀 훅을 통해 상태 관리 로직을 재사용합니다.

- **useAuth.ts**: 
  - 로그인/로그아웃 상태 관리
  - `AuthContext`와 연동하여 토큰 및 유저 정보를 제공

- **useGroups.ts**: 
  - 그룹 목록 fetch 및 상태 관리
  - `groupApi.ts`를 호출하고 결과를 React 상태로 관리

- **useExpenses.ts**: 
  - 특정 그룹의 지출 목록 fetch 및 상태 관리

---

### **6. `src/context/`**
전역 상태를 관리하는 Context API를 정의합니다.

- **AuthContext.tsx**: 
  - 로그인 토큰, 유저 정보를 전역에서 접근 가능하도록 제공
  - `login()`, `logout()` 함수 제공

- **NotificationContext.tsx**: 
  - 미읽음 알림 개수를 전역에서 관리
  - 알림 탭에 뱃지 표시 시 사용

---

### **7. `src/types/`**
TypeScript 타입 정의 파일들입니다. 백엔드 DTO와 동일한 구조로 정의합니다.

예시:
- `auth.types.ts`: `LoginRequest`, `SignUpRequest`, `LoginResponse`
- `group.types.ts`: `GroupDto`, `GroupRequest`, `GroupMemberDto`
- `expense.types.ts`: `ExpenseCreateDTO`, `ExpenseDetailDTO`, `ExpenseItemDTO`
- `settlement.types.ts`: `SettlementCreateRequest`, `SettlementResponse`, `SettlementDetailDto`
- `vote.types.ts`: `VoteResponse`, `CastVoteRequest`, `VoteOptionDto`
- `statistics.types.ts`: `MonthlyStatisticsResponseDto`, `CategorySummaryDto`
- `notification.types.ts`: `NotificationDto`

---

### **8. `src/utils/`**
유틸리티 함수들을 정의합니다.

- **storage.ts**: 
  - AsyncStorage 래퍼 함수
  - `saveToken()`, `getToken()`, `removeToken()`

- **dateFormatter.ts**: 
  - 날짜 포맷 함수 (ISO 8601 → "2025년 1월 1일" 형태)

- **validation.ts**: 
  - 이메일, 비밀번호 유효성 검사 함수

---

### **9. `src/constants/`**
앱 전체에서 사용하는 상수들을 정의합니다.

- **colors.ts**: 
  - 컬러 팔레트 (Primary, Secondary, Background 등)

- **routes.ts**: 
  - 라우트 이름을 상수로 정의하여 오타 방지
  - 예: `export const ROUTES = { LOGIN: 'Login', GROUP_LIST: 'GroupList', ... }`

- **config.ts**: 
  - API Base URL (개발/프로덕션 환경 분기 가능)

---

## 🔗 API 매핑 상세

각 API 함수는 다음과 같은 형태로 작성됩니다:
```typescript
// src/services/api/groupApi.ts 예시
import apiClient from './apiClient';
import { GroupDto, GroupRequest } from '../../types/group.types';

export const createGroup = async (data: GroupRequest): Promise<GroupDto> => {
  const response = await apiClient.post<GroupDto>('/api/groups', data);
  return response.data;
};

export const getMyGroups = async (): Promise<GroupDto[]> => {
  const response = await apiClient.get<GroupDto[]>('/api/groups');
  return response.data;
};

export const getGroupDetail = async (groupId: number): Promise<GroupDto> => {
  const response = await apiClient.get<GroupDto>(`/api/groups/${groupId}`);
  return response.data;
};

// ... 기타 함수들
```

---

## ✅ 다음 단계

1. `IMPLEMENTATION_GUIDE.md`를 참고하여 각 화면의 구체적인 구현 방법을 확인하세요.
2. `API_MAPPING.md`에서 백엔드 엔드포인트와 프론트엔드 함수의 매핑 표를 확인하세요.
3. 타입 정의부터 시작하여 점진적으로 구현해나가세요.