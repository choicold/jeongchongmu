# ChatAssistant Component - 사용 가이드

## 📋 목차

1. [개요](#개요)
2. [기능](#기능)
3. [설치 및 설정](#설치-및-설정)
4. [사용 방법](#사용-방법)
5. [API 연동](#api-연동)
6. [커스터마이징](#커스터마이징)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

`ChatAssistant`는 정총무 앱의 AI 비서 기능을 제공하는 React Native 컴포넌트입니다.
사용자가 앱 어디서든 Global FAB를 통해 AI 비서와 대화할 수 있으며, 이미지 업로드 및 마크다운 렌더링을 지원합니다.

### 주요 특징

- **Global FAB**: 화면 우측 하단에 고정된 Floating Action Button
- **채팅 모달**: 전체 화면의 80% 크기로 열리는 채팅 인터페이스
- **이미지 업로드**: 최대 5개의 이미지를 선택하여 전송 가능
- **Markdown 렌더링**: AI 응답의 마크다운 형식 자동 렌더링
- **Auto-scroll**: 새 메시지 추가 시 자동 스크롤
- **에러 처리**: 네트워크 실패, 타임아웃 등 상황별 에러 메시지 표시

---

## 기능

### 1. UI/UX

#### Global FAB (Floating Action Button)
- 위치: 화면 우측 하단
- 아이콘: 로봇 아이콘 (`robot`)
- 레이블: "AI 비서"
- 색상: Purple (`#6200EE`)

#### Chat Modal
- 크기: 화면 높이의 80%
- 레이아웃:
  - **Header**: 제목, 채팅 초기화 버튼, 닫기 버튼
  - **Messages Area**: 사용자 (우측) / AI (좌측) 메시지 버블
  - **Image Preview**: 선택된 이미지 미리보기 (전송 전)
  - **Input Area**: 이미지 선택 버튼, 텍스트 입력, 전송 버튼

#### Message Bubbles
- **사용자 메시지**:
  - 위치: 우측 정렬
  - 배경색: Purple (`#6200EE`)
  - 텍스트색: White
  - 이미지 첨부 시 상단에 이미지 표시

- **AI 메시지**:
  - 위치: 좌측 정렬
  - 배경색: White
  - 테두리: Gray (`#E0E0E0`)
  - Markdown 렌더링 지원

### 2. 이미지 업로드

- **최대 개수**: 5개
- **선택 방법**: 갤러리에서 다중 선택
- **미리보기**: 전송 전 선택된 이미지를 하단에 표시
- **제거**: 각 이미지마다 X 버튼으로 개별 제거 가능
- **권한**: 자동으로 미디어 라이브러리 접근 권한 요청

### 3. Markdown 렌더링

AI 응답에서 지원되는 마크다운 문법:

- **Bold**: `**굵게**` → **굵게**
- **Italic**: `*기울임*` → *기울임*
- **Bullet List**: `- 항목` → • 항목
- **Numbered List**: `1. 항목` → 1. 항목
- **Inline Code**: `` `코드` `` → `코드`
- **Code Block**: ` ```코드 블록``` `
- **Link**: `[링크](url)` → 클릭 가능한 링크

---

## 설치 및 설정

### 1. 의존성 설치

이미 프로젝트에 포함된 패키지들:
```bash
# 이미 package.json에 포함됨
- expo-image-picker (~17.0.8)
- axios (^1.12.2)
- react-native-paper (^5.14.5)
```

새로 추가된 패키지:
```bash
npm install react-native-markdown-display
```

### 2. 파일 구조

```
src/
├── components/
│   └── common/
│       ├── ChatAssistant.tsx       # 메인 UI 컴포넌트
│       └── index.ts                # Export 파일
├── hooks/
│   └── useChatAssistant.ts         # 로직 훅
├── services/
│   └── api/
│       └── apiClient.ts            # API 클라이언트 (이미 존재)
└── utils/
    └── storage.ts                  # 토큰 저장 (이미 존재)
```

---

## 사용 방법

### 기본 사용법

#### 1. App.tsx에 추가

```tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ChatAssistant } from './src/components/common';

export default function App() {
  return (
    <PaperProvider>
      <SafeAreaView style={{ flex: 1 }}>
        {/* 메인 콘텐츠 */}
        <YourMainContent />

        {/* AI 비서 FAB - 전역에서 사용 가능 */}
        <ChatAssistant />
      </SafeAreaView>
    </PaperProvider>
  );
}
```

#### 2. Navigation과 함께 사용

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { ChatAssistant } from './src/components/common';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Groups" component={GroupsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>

        {/* Navigation 외부에 배치하여 모든 화면에서 접근 가능 */}
        <ChatAssistant />
      </NavigationContainer>
    </PaperProvider>
  );
}
```

### 고급 사용법

#### 커스텀 훅 직접 사용

`useChatAssistant` 훅을 직접 사용하여 커스텀 UI를 만들 수 있습니다:

```tsx
import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { useChatAssistant } from './hooks/useChatAssistant';

export function CustomChatUI() {
  const [input, setInput] = useState('');

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    pickImages,
    selectedImages,
    clearChat,
  } = useChatAssistant();

  const handleSend = async () => {
    await sendMessage(input);
    setInput('');
  };

  return (
    <View>
      {/* 메시지 표시 */}
      {messages.map((msg) => (
        <Text key={msg.id}>{msg.content}</Text>
      ))}

      {/* 입력 */}
      <TextInput value={input} onChangeText={setInput} />
      <Button title="이미지 선택" onPress={pickImages} />
      <Button title="전송" onPress={handleSend} disabled={isLoading} />
      <Button title="초기화" onPress={clearChat} />
    </View>
  );
}
```

---

## API 연동

### 백엔드 엔드포인트

```
POST /api/mcp/chat
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

### Request Payload

```typescript
{
  message: string;           // 사용자 메시지
  files: File[];            // 이미지 파일 배열 (최대 5개, optional)
}
```

### Response

```typescript
// Plain string 반환 (Markdown 형식 포함 가능)
"안녕하세요! 무엇을 도와드릴까요?"
```

### 에러 처리

| 상태 코드 | 설명 | 클라이언트 메시지 |
|----------|------|------------------|
| 401 | 인증 실패 | "로그인이 필요합니다." |
| 413 | 파일 크기 초과 | "이미지 파일이 너무 큽니다." |
| 408/ECONNABORTED | 타임아웃 | "AI 응답 시간이 초과되었습니다." |
| 기타 | 서버 에러 | "메시지 전송에 실패했습니다." |

### 타임아웃 설정

AI 응답 대기 시간은 **60초**로 설정되어 있습니다:

```typescript
// src/hooks/useChatAssistant.ts
const response = await apiClient.post<string>(
  '/api/mcp/chat',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60초
  }
);
```

---

## 커스터마이징

### 1. 색상 변경

`ChatAssistant.tsx` 파일의 `styles` 객체에서 색상을 수정할 수 있습니다:

```tsx
const styles = StyleSheet.create({
  fab: {
    backgroundColor: '#6200EE', // FAB 배경색
  },
  userBubble: {
    backgroundColor: '#6200EE', // 사용자 메시지 배경색
  },
  sendButton: {
    backgroundColor: '#6200EE', // 전송 버튼 배경색
  },
});
```

### 2. 마크다운 스타일 변경

```tsx
const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 15,
    lineHeight: 20,
  },
  strong: {
    fontWeight: 'bold',
    color: '#000', // 볼드체 색상
  },
  link: {
    color: '#6200EE', // 링크 색상
  },
};
```

### 3. 모달 크기 변경

```tsx
modalContainer: {
  height: SCREEN_HEIGHT * 0.8, // 화면 높이의 80%
  // 변경 예: height: SCREEN_HEIGHT * 0.9, (90%)
},
```

### 4. 이미지 최대 개수 변경

```tsx
// src/hooks/useChatAssistant.ts
const pickImages = useCallback(async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    selectionLimit: 5 - selectedImages.length, // 5를 다른 숫자로 변경
  });
}, [selectedImages]);
```

---

## 트러블슈팅

### 1. FAB가 표시되지 않아요

**원인**: `PaperProvider`가 없음

**해결**:
```tsx
import { Provider as PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <PaperProvider>
      <YourApp />
      <ChatAssistant />
    </PaperProvider>
  );
}
```

### 2. 이미지 선택 시 권한 에러가 발생해요

**원인**: iOS의 경우 `Info.plist`에 권한 설정이 필요합니다.

**해결**: `app.config.js`에 추가
```javascript
export default {
  expo: {
    ios: {
      infoPlist: {
        NSPhotoLibraryUsageDescription: "정총무에서 영수증 이미지를 업로드하기 위해 사진 라이브러리 접근이 필요합니다.",
      },
    },
  },
};
```

### 3. 메시지 전송 시 "로그인이 필요합니다" 에러

**원인**: 토큰이 없거나 만료됨

**해결**:
1. 로그인 상태 확인
2. `AsyncStorage`에 토큰이 저장되어 있는지 확인
```typescript
import { getToken } from './src/utils/storage';

const token = await getToken();
console.log('Current token:', token);
```

### 4. AI 응답이 너무 오래 걸려요

**원인**: 백엔드 처리 시간 또는 네트워크 지연

**해결**:
- 타임아웃 시간을 늘리기: `useChatAssistant.ts`의 `timeout: 60000`을 더 큰 값으로 변경
- 백엔드 로그 확인하여 병목 구간 파악

### 5. Markdown이 렌더링되지 않아요

**원인**: `react-native-markdown-display` 라이브러리 미설치

**해결**:
```bash
npm install react-native-markdown-display
```

### 6. Android에서 이미지가 표시되지 않아요

**원인**: Android 권한 설정 필요

**해결**: `app.config.js`에 추가
```javascript
export default {
  expo: {
    android: {
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
    },
  },
};
```

---

## 예제 시나리오

### 시나리오 1: 단순 텍스트 메시지

1. 사용자가 FAB 클릭
2. 채팅 모달 열림
3. "안녕하세요" 입력 후 전송
4. AI가 마크다운 형식으로 응답:
   ```
   안녕하세요! **정총무 AI 비서**입니다.

   다음 기능을 이용하실 수 있습니다:
   - 그룹 관리
   - 지출 기록
   - 영수증 분석

   무엇을 도와드릴까요?
   ```

### 시나리오 2: 이미지 업로드

1. 사용자가 이미지 버튼 클릭
2. 갤러리에서 영수증 사진 3장 선택
3. 하단에 선택된 이미지 미리보기 표시
4. "이 영수증들 분석해줘" 입력 후 전송
5. AI가 OCR 분석 결과 반환:
   ```
   영수증 3장을 분석했습니다.

   **영수증 1**
   - 제목: 스타벅스
   - 금액: 4,500원

   **영수증 2**
   - 제목: GS25
   - 금액: 12,000원

   ...
   ```

### 시나리오 3: 복합 작업

1. "우리 그룹의 이번 달 지출 내역 보여줘"
2. AI가 그룹 목록 조회 → 특정 그룹의 지출 내역 조회 → 결과 표시
3. "이 중에서 가장 큰 지출 3개를 투표로 만들어줘"
4. AI가 투표 생성 → 완료 메시지 표시

---

## API 인터페이스

### `useChatAssistant` Hook

```typescript
interface UseChatAssistantReturn {
  // 상태
  messages: ChatMessage[];        // 채팅 메시지 배열
  isLoading: boolean;             // 로딩 상태
  error: string | null;           // 에러 메시지
  selectedImages: string[];       // 선택된 이미지 URI 배열

  // 함수
  sendMessage: (text: string) => Promise<void>;  // 메시지 전송
  pickImages: () => Promise<void>;               // 이미지 선택
  removeImage: (uri: string) => void;            // 이미지 제거
  clearSelectedImages: () => void;               // 선택 이미지 전체 제거
  clearChat: () => void;                         // 채팅 내역 초기화
}
```

### `ChatMessage` 타입

```typescript
interface ChatMessage {
  id: string;                   // 고유 ID
  role: 'user' | 'assistant';   // 메시지 역할
  content: string;              // 메시지 내용
  timestamp: Date;              // 생성 시간
  images?: string[];            // 첨부 이미지 (사용자 메시지만)
}
```

---

## 성능 최적화

### 1. 이미지 품질 조정

메모리 절약을 위해 이미지 품질을 조정할 수 있습니다:

```typescript
// src/hooks/useChatAssistant.ts
const result = await ImagePicker.launchImageLibraryAsync({
  quality: 0.8, // 0.8을 더 낮은 값으로 변경 (0.5~0.7)
});
```

### 2. 메시지 개수 제한

메모리 절약을 위해 오래된 메시지를 제거할 수 있습니다:

```typescript
// 예: 최대 50개 메시지만 유지
const MAX_MESSAGES = 50;

setMessages(prev => {
  const newMessages = [...prev, newMessage];
  return newMessages.slice(-MAX_MESSAGES);
});
```

---

## 라이선스

MIT License

---

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
