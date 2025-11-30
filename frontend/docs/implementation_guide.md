# 정총무 - 화면별 구현 가이드

본 문서는 정총무 앱의 각 화면(Screen)을 구현할 때 필요한 상세 가이드를 제공합니다.

---

## 📋 목차

1. [인증 관련 화면](#1-인증-관련-화면)
2. [그룹 관련 화면](#2-그룹-관련-화면)
3. [지출 관련 화면](#3-지출-관련-화면)
4. [정산 관련 화면](#4-정산-관련-화면)
5. [통계 화면](#5-통계-화면)
6. [알림 화면](#6-알림-화면)
7. [공통 컴포넌트 가이드](#7-공통-컴포넌트-가이드)

---

## 1. 인증 관련 화면

### 1.1 LoginScreen.tsx

**목적**: 사용자가 이메일과 비밀번호로 로그인합니다.

**필요한 State**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**호출할 Services**:
- `authApi.login(email, password)` → 토큰 반환

**구현 흐름**:
1. 사용자가 이메일, 비밀번호 입력
2. "로그인" 버튼 클릭 시:
   - `setLoading(true)`
   - `authApi.login()` 호출
   - 성공 시: 토큰을 `AsyncStorage`에 저장하고 `AuthContext`의 `login()` 호출
   - 실패 시: 에러 메시지 표시
   - `setLoading(false)`
3. 로그인 성공 시 `MainNavigator`로 자동 이동

**사용 컴포넌트**:
- `Input` (이메일, 비밀번호)
- `Button` (로그인 버튼)
- `ErrorMessage` (에러 표시)

---

### 1.2 SignUpScreen.tsx

**목적**: 신규 사용자 회원가입

**필요한 State**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [name, setName] = useState('');
const [bankName, setBankName] = useState('');
const [accountNumber, setAccountNumber] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**호출할 Services**:
- `authApi.signUp({ email, password, name, bankName, accountNumber })`

**구현 흐름**:
1. 모든 필드 입력받기
2. "회원가입" 버튼 클릭 시:
   - 입력값 검증 (`validation.ts` 사용)
   - `authApi.signUp()` 호출
   - 성공 시: "회원가입 완료" 메시지 표시 후 `LoginScreen`으로 이동
   - 실패 시: 에러 메시지 표시

**사용 컴포넌트**:
- `Input` (여러 개)
- `Button`
- `ErrorMessage`

---

## 2. 그룹 관련 화면

### 2.1 GroupListScreen.tsx

**목적**: 내가 속한 그룹 목록을 표시합니다.

**필요한 State**:
```typescript
const [groups, setGroups] = useState<GroupDto[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

**호출할 Services**:
- `groupApi.getMyGroups()`

**구현 흐름**:
1. 화면 진입 시 `useEffect`에서 `groupApi.getMyGroups()` 호출
2. FlatList로 그룹 목록 렌더링
3. 각 그룹 카드 클릭 시 → `GroupDetailScreen`으로 이동
4. 우측 상단에 "+" 버튼 → `CreateGroupScreen`으로 이동
5. Pull-to-refresh 지원

**사용 컴포넌트**:
- `Card` (각 그룹 항목)
- `LoadingSpinner`
- `Button` (그룹 생성 버튼)

---

### 2.2 GroupDetailScreen.tsx

**목적**: 특정 그룹의 상세 정보를 표시합니다 (멤버 목록, 초대 코드, 지출 요약).

**필요한 State**:
```typescript
const [group, setGroup] = useState<GroupDto | null>(null);
const [members, setMembers] = useState<GroupMemberDto[]>([]);
const [loading, setLoading] = useState(true);
```

**호출할 Services**:
- `groupApi.getGroupDetail(groupId)`
- `groupMemberApi.getGroupMembers(groupId)`

**구현 흐름**:
1. `route.params.groupId`로 그룹 ID 받기
2. 두 API를 병렬로 호출하여 그룹 정보와 멤버 목록 가져오기
3. 화면 구성:
   - 그룹명, 설명
   - 초대 코드 표시 (복사 버튼)
   - 멤버 목록
   - "지출 내역 보기" 버튼 → `ExpenseListScreen`으로 이동
   - OWNER인 경우: "그룹 수정", "멤버 관리" 버튼 표시

**사용 컴포넌트**:
- `Card`
- `Button`
- FlatList (멤버 목록)

---

### 2.3 CreateGroupScreen.tsx

**목적**: 새 그룹을 생성합니다.

**필요한 State**:
```typescript
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [loading, setLoading] = useState(false);
```

**호출할 Services**:
- `groupApi.createGroup({ name, description })`

**구현 흐름**:
1. 그룹명, 설명 입력받기
2. "생성" 버튼 클릭 시:
   - `groupApi.createGroup()` 호출
   - 성공 시: 생성된 그룹의 상세 화면으로 이동
   - 실패 시: 에러 메시지 표시

**사용 컴포넌트**:
- `Input`
- `Button`

---

### 2.4 JoinGroupScreen.tsx

**목적**: 초대 코드를 입력하여 그룹에 참여합니다.

**필요한 State**:
```typescript
const [inviteCode, setInviteCode] = useState('');
const [loading, setLoading] = useState(false);
```

**호출할 Services**:
- `groupMemberApi.joinGroup({ inviteCode })`

**구현 흐름**:
1. 초대 코드 입력받기
2. "참여하기" 버튼 클릭 시:
   - `groupMemberApi.joinGroup()` 호출
   - 성공 시: 참여한 그룹의 상세 화면으로 이동
   - 실패 시: "유효하지 않은 코드" 메시지 표시

**사용 컴포넌트**:
- `Input`
- `Button`

---

## 3. 지출 관련 화면

### 3.1 ExpenseListScreen.tsx

**목적**: 특정 그룹의 지출 내역을 리스트로 표시합니다.

**필요한 State**:
```typescript
const [expenses, setExpenses] = useState<ExpenseSimpleDTO[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

**호출할 Services**:
- `expenseApi.getExpensesByGroup(groupId)`

**구현 흐름**:
1. `route.params.groupId`로 그룹 ID 받기
2. `expenseApi.getExpensesByGroup()` 호출
3. FlatList로 지출 목록 렌더링 (`ExpenseCard` 사용)
4. 각 카드 클릭 시 → `ExpenseDetailScreen`으로 이동
5. 우측 하단 FAB 버튼:
   - "수동 입력" → `CreateExpenseScreen`
   - "영수증 스캔" → `OCRScanScreen`

**사용 컴포넌트**:
- `ExpenseCard`
- `LoadingSpinner`
- FAB (Floating Action Button)

---

### 3.2 ExpenseDetailScreen.tsx

**목적**: 지출의 상세 정보를 표시합니다 (항목, 참여자, 태그).

**필요한 State**:
```typescript
const [expense, setExpense] = useState<ExpenseDetailDTO | null>(null);
const [loading, setLoading] = useState(true);
```

**호출할 Services**:
- `expenseApi.getExpenseDetail(expenseId)`

**구현 흐름**:
1. `route.params.expenseId`로 지출 ID 받기
2. `expenseApi.getExpenseDetail()` 호출
3. 화면 구성:
   - 제목, 총 금액, 지불자
   - 날짜 (expenseData)
   - 세부 항목 리스트 (`ExpenseItemList` 컴포넌트)
   - 참여자 목록
   - 태그 목록
   - 영수증 이미지 (있는 경우)
4. 수정/삭제 버튼 (본인 또는 OWNER만 표시)

**사용 컴포넌트**:
- `Card`
- `ExpenseItemList`
- `TagSelector` (읽기 전용 모드)
- `Button` (수정, 삭제)

---

### 3.3 CreateExpenseScreen.tsx

**목적**: 지출을 수동으로 등록합니다.

**필요한 State**:
```typescript
const [title, setTitle] = useState('');
const [amount, setAmount] = useState('');
const [expenseData, setExpenseData] = useState(new Date());
const [items, setItems] = useState<ExpenseItemDTO[]>([]);
const [participantIds, setParticipantIds] = useState<number[]>([]);
const [tagNames, setTagNames] = useState<string[]>([]);
const [loading, setLoading] = useState(false);
```

**호출할 Services**:
- `expenseApi.createExpense({ title, amount, expenseData, groupId, participantIds, items, tagNames })`
- `groupMemberApi.getGroupMembers(groupId)` (참여자 선택 시)

**구현 흐름**:
1. 그룹 ID는 `route.params` 또는 이전 화면에서 전달받기
2. 제목, 총 금액, 날짜 입력
3. "세부 항목 추가" 버튼으로 품목 리스트 관리 (이름, 가격, 수량)
4. 참여자 선택 (그룹 멤버 목록에서 다중 선택)
5. 태그 입력 (텍스트 입력 또는 기존 태그 선택)
6. "등록" 버튼 클릭 시:
   - 검증 (총액 == 항목 합계)
   - `expenseApi.createExpense()` 호출
   - 성공 시: `ExpenseListScreen`으로 돌아가기

**사용 컴포넌트**:
- `Input`
- `Button`
- `ExpenseItemList` (편집 모드)
- `TagSelector`
- DateTimePicker

---

### 3.4 OCRScanScreen.tsx

**목적**: 카메라로 영수증을 촬영하고, OCR 결과를 받아 지출 등록 폼에 자동 입력합니다.

**필요한 State**:
```typescript
const [image, setImage] = useState<string | null>(null);
const [ocrResult, setOcrResult] = useState<OcrResultDTO | null>(null);
const [loading, setLoading] = useState(false);
```

**호출할 Services**:
- `OCRService.scanReceipt(imageUri)` (내부적으로 `ocrApi.scan()` 호출)

**구현 흐름**:
1. 화면 진입 시 카메라 권한 요청
2. "사진 촬영" 버튼 클릭 시:
   - `expo-image-picker`의 `launchCameraAsync()` 호출
   - 촬영된 이미지 URI 저장
3. "OCR 분석" 버튼 클릭 시:
   - `OCRService.scanReceipt(imageUri)` 호출
   - 서버로부터 `{ title, amount, items: [...] }` 형태의 JSON 수신
4. 결과 화면 표시:
   - 인식된 제목, 금액, 항목 리스트 표시
   - "수정" 버튼 → 수동으로 수정 가능
   - "등록" 버튼 → `CreateExpenseScreen`으로 이동하여 폼에 자동 입력

**사용 컴포넌트**:
- `Button`
- `Image` (촬영한 영수증 미리보기)
- `ExpenseItemList` (OCR 결과 표시)

**주의사항**:
- OCR 결과가 100% 정확하지 않을 수 있으므로, 사용자가 수정할 수 있는 UI 제공 필수

---

### 3.5 EditExpenseScreen.tsx

**목적**: 기존 지출을 수정합니다.

**필요한 State**:
```typescript
// CreateExpenseScreen과 동일하나, 초기값을 기존 지출 데이터로 설정
const [title, setTitle] = useState(expense.title);
const [amount, setAmount] = useState(expense.amount.toString());
// ... 나머지 state들
```

**호출할 Services**:
- `expenseApi.getExpenseDetail(expenseId)` (초기 데이터 로드)
- `expenseApi.updateExpense(expenseId, data)`

**구현 흐름**:
1. 기존 지출 데이터를 불러와 폼에 표시
2. 사용자가 수정
3. "저장" 버튼 클릭 시 `expenseApi.updateExpense()` 호출
4. 성공 시 상세 화면으로 돌아가기

---

## 4. 정산 관련 화면

### 4.1 CreateSettlementScreen.tsx

**목적**: 정산을 생성합니다. 정산 방식(N분의 1, 직접, 퍼센트, 항목별)을 선택합니다.

**필요한 State**:
```typescript
const [selectedExpense, setSelectedExpense] = useState<ExpenseDetailDTO | null>(null);
const [method, setMethod] = useState<SettlementMethod>('N_BUN_1');
const [participantIds, setParticipantIds] = useState<number[]>([]);
const [directEntries, setDirectEntries] = useState<DirectSettlementEntry[]>([]);
const [percentEntries, setPercentEntries] = useState<PercentSettlementEntry[]>([]);
const [loading, setLoading] = useState(false);
```

**호출할 Services**:
- `settlementApi.createSettlement({ expenseId, method, participantIds, directEntries, percentEntries })`
- `voteApi.createVote(expenseId)` (항목별 정산 선택 시)

**구현 흐름**:
1. 지출 목록에서 정산할 지출 선택 (또는 이전 화면에서 전달받기)
2. 정산 방식 선택:
   - **N분의 1**: 참여자만 선택하면 됨
   - **직접 입력**: 각 참여자별로 금액 직접 입력
   - **퍼센트**: 각 참여자별로 비율(%) 입력
   - **항목별**: 투표 생성 → `VoteScreen`으로 이동
3. "정산 생성" 버튼 클릭 시:
   - `settlementApi.createSettlement()` 호출
   - 성공 시: `SettlementDetailScreen`으로 이동 (정산 결과 표시)

**사용 컴포넌트**:
- `SettlementMethodSelector`
- `Input` (금액, 비율 입력)
- `Button`

---

### 4.2 SettlementDetailScreen.tsx

**목적**: 정산 결과를 표시합니다 ("누가 누구에게 얼마를 보내야 하는지").

**필요한 State**:
```typescript
const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
const [loading, setLoading] = useState(true);
```

**호출할 Services**:
- `settlementApi.getSettlement(settlementId)` (추후 구현 예정)
  - 현재는 정산 생성 시 반환된 데이터를 `route.params`로 받아 표시

**구현 흐름**:
1. 정산 결과 데이터 표시:
   - 총 금액
   - 정산 방식
   - 세부 내역 리스트 (`SettlementDetailCard` 사용)
     - 예: "철수 → 영희: 10,000원 [송금하기]"
2. "송금하기" 버튼 클릭 시:
   - `DeepLinkService.openTossTransfer(bankName, accountNumber, amount)` 호출
   - 토스 앱으로 이동

**사용 컴포넌트**:
- `SettlementDetailCard`
- `Button`

---

### 4.3 VoteScreen.tsx

**목적**: 항목별 정산 시, 멤버들이 각자 먹은 메뉴를 선택(투표)합니다.

**필요한 State**:
```typescript
const [voteData, setVoteData] = useState<VoteResponse | null>(null);
const [selectedOptions, setSelectedOptions] = useState<number[]>([]); // 내가 선택한 옵션 ID들
const [loading, setLoading] = useState(false);
```

**호출할 Services**:
- `voteApi.getVoteStatus(expenseId)` (투표 현황 조회)
- `voteApi.castVote({ userId, optionId })` (투표하기)

**구현 흐름**:
1. 투표 현황 조회하여 메뉴 리스트 표시
2. 각 메뉴 카드에 체크박스 표시 (다중 선택 가능)
3. 이미 선택한 사람들의 이름도 표시 (예: "철수, 영희 선택함")
4. "투표하기" 버튼 클릭 시:
   - 선택한 옵션들에 대해 `voteApi.castVote()` 반복 호출
   - 성공 시: 투표 현황 다시 조회하여 갱신
5. 모든 멤버가 투표를 완료하면 "투표 마감" 버튼 활성화 (OWNER만)
6. 투표 마감 후 → 정산 결과 화면으로 이동

**사용 컴포넌트**:
- `VoteOptionCard`
- `Button`

---

## 5. 통계 화면

### 5.1 StatisticsScreen.tsx

**목적**: 그룹별 월간/연간 지출 통계 및 차트를 표시합니다.

**필요한 State**:
```typescript
const [groupId, setGroupId] = useState<number>(1); // 드롭다운으로 그룹 선택
const [year, setYear] = useState(2025);
const [month, setMonth] = useState(1);
const [statistics, setStatistics] = useState<MonthlyStatisticsResponseDto | null>(null);
const [loading, setLoading] = useState(true);
```

**호출할 Services**:
- `statisticsApi.getMonthlyStatistics(groupId, year, month)`

**구현 흐름**:
1. 그룹, 연도, 월 선택 (드롭다운 또는 Picker)
2. `statisticsApi.getMonthlyStatistics()` 호출
3. 화면 구성:
   - 총 지출 금액, 지출 횟수
   - 카테고리별 지출 파이 차트 (`CategoryPieChart`)
   - 월별 지출 라인 차트 (`MonthlyChart`)
   - 가장 큰 지출 항목 표시
   - 미완료 정산 목록

**사용 컴포넌트**:
- `MonthlyChart`
- `CategoryPieChart`
- `Card`

---

## 6. 알림 화면

### 6.1 NotificationListScreen.tsx

**목적**: 알림 목록을 표시하고 읽음 처리합니다.

**필요한 State**:
```typescript
const [notifications, setNotifications] = useState<NotificationDto[]>([]);
const [loading, setLoading] = useState(true);
```

**호출할 Services**:
- `notificationApi.getNotifications()`
- `notificationApi.markAsRead(notificationId)`

**구현 흐름**:
1. `notificationApi.getNotifications()` 호출하여 알림 목록 가져오기
2. FlatList로 알림 표시 (제목, 내용, 시간, 읽음 여부)
3. 각 알림 클릭 시:
   - `notificationApi.markAsRead()` 호출
   - 알림 타입에 따라 관련 화면으로 이동
     - 예: 정산 요청 → `SettlementDetailScreen`
     - 예: 투표 생성 → `VoteScreen`

**사용 컴포넌트**:
- `Card` (각 알림 항목)
- `LoadingSpinner`

---

## 7. 공통 컴포넌트 가이드

### 7.1 Button.tsx
재사용 가능한 커스텀 버튼 컴포넌트

**Props**:
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}
```

**구현 예시**:
```typescript
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', loading, disabled }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, styles[variant]]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
};
```

---

### 7.2 Input.tsx
텍스트 입력 컴포넌트

**Props**:
```typescript
interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  error?: string;
}
```

---

### 7.3 ExpenseCard.tsx
지출 항목을 카드 형태로 표시

**Props**:
```typescript
interface ExpenseCardProps {
  expense: ExpenseSimpleDTO;
  onPress: () => void;
}
```

**구현 예시**:
```typescript
import { Card } from 'react-native-paper';

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onPress }) => {
  return (
    <Card onPress={onPress} style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{expense.title}</Text>
        <Text style={styles.amount}>{expense.amount.toLocaleString()}원</Text>
        <Text style={styles.payer}>지불자: {expense.payerName}</Text>
        <Text style={styles.date}>{formatDate(expense.expenseData)}</Text>
      </Card.Content>
    </Card>
  );
};
```

---

### 7.4 SettlementDetailCard.tsx
정산 내역 카드 ("A → B: 10,000원")

**Props**:
```typescript
interface SettlementDetailCardProps {
  detail: SettlementDetailDto;
  onTransfer: () => void;
}
```

**구현 예시**:
```typescript
const SettlementDetailCard: React.FC<SettlementDetailCardProps> = ({ detail, onTransfer }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text>{detail.debtorName} → {detail.creditorName}</Text>
        <Text style={styles.amount}>{detail.amount.toLocaleString()}원</Text>
        <Text>{detail.creditorBankName} {detail.creditorAccountNumber}</Text>
      </Card.Content>
      <Card.Actions>
        <Button title="송금하기" onPress={onTransfer} />
      </Card.Actions>
    </Card>
  );
};
```

---

### 7.5 VoteOptionCard.tsx
투표 선택지 카드

**Props**:
```typescript
interface VoteOptionCardProps {
  option: VoteOptionDto;
  isSelected: boolean;
  onToggle: () => void;
}
```

---

## 8. 추가 고려사항

### 8.1 에러 처리
모든 API 호출에서 에러를 `try-catch`로 잡고, 사용자에게 친절한 메시지를 표시하세요.
```typescript
try {
  const data = await expenseApi.createExpense(formData);
  navigation.goBack();
} catch (error: any) {
  setError(error.response?.data?.message || '지출 등록에 실패했습니다.');
}
```

---

### 8.2 로딩 상태
API 호출 중에는 `LoadingSpinner`를 표시하여 사용자 경험을 개선하세요.

---

### 8.3 토큰 갱신
`apiClient.ts`의 인터셉터에서 401 에러 발생 시 자동으로 로그아웃 처리하도록 구현하세요.
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // 로그인 화면으로 이동
    }
    return Promise.reject(error);
  }
);
```

---

### 8.4 푸시 알림 (FCM Token)
로그인 성공 후 FCM 토큰을 서버로 전송하여 알림을 받을 수 있도록 설정하세요.
```typescript
// 로그인 성공 후
const fcmToken = await messaging().getToken();
await userApi.updateFcmToken(fcmToken);
```

---

## 9. 테스트 시나리오

각 화면 구현 후 다음 시나리오로 테스트하세요:

1. **로그인 → 그룹 생성 → 지출 등록 → 정산 생성 → 송금**
2. **OCR 스캔 → 자동 입력 → 수정 → 등록**
3. **투표 생성 → 멤버들 투표 → 투표 마감 → 정산 결과 확인**
4. **알림 수신 → 클릭하여 관련 화면 이동**

---

## ✅ 다음 단계

1. 타입 정의부터 시작하세요 (`src/types/` 폴더).
2. API 클라이언트를 구현하세요 (`src/services/api/` 폴더).
3. 공통 컴포넌트를 먼저 만드세요 (`src/components/common/`).
4. 화면을 하나씩 구현하며 테스트하세요.
5. 네비게이션을 연결하세요.