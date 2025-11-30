# API 연결 디버깅 가이드

## 목차
1. [문제 진단하기](#문제-진단하기)
2. [로그 확인하기](#로그-확인하기)
3. [연결 테스트하기](#연결-테스트하기)
4. [일반적인 문제 해결](#일반적인-문제-해결)

---

## 문제 진단하기

### 앱 실행 시 자동으로 확인되는 정보

앱을 실행하면 콘솔에 다음 정보가 자동으로 출력됩니다:

```
🌐 API Base URL: http://localhost:8080
```

이 정보를 통해 앱이 어떤 서버에 연결하려고 하는지 확인할 수 있습니다.

---

## 로그 확인하기

### 1. API 요청 로그

API 요청이 발생하면 다음과 같은 로그가 출력됩니다:

```
📤 API 요청: {
  method: 'POST',
  url: 'http://localhost:8080/api/user/signup',
  headers: {...},
  data: {...}
}
```

### 2. API 응답 성공 로그

서버가 정상적으로 응답하면:

```
📥 API 응답 성공: {
  url: '/api/user/signup',
  status: 200,
  data: {...}
}
```

### 3. API 에러 로그

에러가 발생하면 상세한 정보가 출력됩니다:

```
❌ API 에러 상세: {
  url: '/api/user/signup',
  method: 'POST',
  baseURL: 'http://localhost:8080',
  fullURL: 'http://localhost:8080/api/user/signup',
  status: undefined,
  message: 'timeout of 10000ms exceeded',
  code: 'ECONNABORTED'
}
```

#### 타임아웃 에러

```
⏱️  타임아웃 에러: 서버가 응답하지 않습니다.
💡 해결 방법:
   1. 서버가 실행 중인지 확인하세요
   2. API URL이 올바른지 확인하세요: http://localhost:8080
   3. 네트워크 연결을 확인하세요
```

#### 네트워크 에러

```
🌐 네트워크 에러: 서버에 연결할 수 없습니다.
💡 해결 방법:
   1. 서버 URL을 확인하세요: http://localhost:8080
   2. 모바일에서는 localhost 대신 PC의 IP 주소를 사용하세요
   3. 방화벽 설정을 확인하세요
```

---

## 연결 테스트하기

### 방법 1: 코드로 테스트하기

앱의 아무 컴포넌트에서 다음 함수를 호출하여 테스트할 수 있습니다:

```typescript
import { testAPIConnection, printNetworkInfo, testSignupEndpoint } from '../utils/apiDebug';

// 1. 네트워크 정보 출력
printNetworkInfo();

// 2. 일반 API 연결 테스트 (/api/health 엔드포인트)
const result = await testAPIConnection();
console.log(result);

// 3. 특정 URL로 테스트
const result = await testAPIConnection('http://192.168.0.10:8080');
console.log(result);

// 4. 회원가입 엔드포인트 테스트
const signupResult = await testSignupEndpoint();
console.log(signupResult);
```

### 방법 2: 로그인/회원가입 화면에서 테스트

회원가입 화면에 테스트 버튼을 추가하는 방법:

```tsx
import { testAPIConnection } from '../utils/apiDebug';

// 버튼 추가
<Button
  title="서버 연결 테스트"
  onPress={async () => {
    const result = await testAPIConnection();
    Alert.alert(
      result.success ? '성공' : '실패',
      result.message
    );
  }}
/>
```

---

## 일반적인 문제 해결

### 1. 타임아웃 에러 (timeout of 10000ms exceeded)

**원인:**
- 서버가 실행되지 않음
- 잘못된 서버 URL
- 네트워크 연결 문제

**해결 방법:**

#### ✅ 백엔드 서버 확인
```bash
# 백엔드 서버가 실행 중인지 확인
# 포트 8080이 사용 중인지 확인 (macOS/Linux)
lsof -i :8080

# 포트 8080이 사용 중인지 확인 (Windows)
netstat -ano | findstr :8080
```

#### ✅ API URL 설정

모바일 기기나 에뮬레이터에서 테스트하는 경우:

1. **PC의 IP 주소 확인**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. **환경 변수 설정**

   프로젝트 루트에 `.env` 파일 생성:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:8080
   ```

   예시:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.0.10:8080
   ```

3. **앱 재시작**
   ```bash
   # Metro 번들러 재시작
   # Ctrl+C로 중지 후 다시 실행
   npx expo start --clear
   ```

### 2. 네트워크 에러 (Network Error)

**원인:**
- localhost 사용 (모바일 기기에서)
- 방화벽 차단
- 서버 미실행

**해결 방법:**

#### ✅ localhost 대신 IP 주소 사용
위의 "API URL 설정" 참고

#### ✅ 방화벽 확인
```bash
# macOS - 방화벽 설정 확인
# 시스템 환경설정 > 보안 및 개인 정보 보호 > 방화벽

# Windows - 방화벽 설정 확인
# 제어판 > Windows Defender 방화벽
# 포트 8080이 허용되어 있는지 확인
```

### 3. 401/403 에러

**원인:**
- 인증 토큰 문제
- 권한 부족

**해결 방법:**
```typescript
// AsyncStorage에서 토큰 확인
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('token');
console.log('저장된 토큰:', token);

// 토큰 삭제 후 재로그인
await AsyncStorage.removeItem('token');
```

### 4. 서버는 실행 중인데 연결 안 됨

**확인 사항:**

1. **서버 포트 확인**
   ```bash
   # 서버 로그에서 포트 확인
   # 예: Server is running on port 8080
   ```

2. **같은 네트워크에 있는지 확인**
   - PC와 모바일이 같은 Wi-Fi에 연결되어 있어야 함

3. **PC와 모바일 간 통신 테스트**
   ```bash
   # 모바일에서 PC로 ping 테스트
   ping YOUR_PC_IP
   ```

---

## 타임아웃 시간 조정

필요한 경우 타임아웃 시간을 조정할 수 있습니다:

**파일:** `src/services/api/apiClient.ts`

```typescript
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 -> 원하는 시간으로 변경 (밀리초)
  headers: {
    'Content-Type': 'application/json',
  },
});
```

예시:
- `timeout: 30000` → 30초
- `timeout: 60000` → 60초

---

## 추가 도움말

### React Native Debugger 사용

1. **설치**
   ```bash
   brew install --cask react-native-debugger
   ```

2. **실행 및 연결**
   - React Native Debugger 실행
   - 앱에서 Cmd+D (iOS) 또는 Cmd+M (Android)
   - "Debug" 선택

3. **네트워크 탭 확인**
   - 모든 API 요청/응답 확인 가능

### Expo 개발자 메뉴

- iOS: Cmd+D
- Android: Cmd+M

"Reload" 또는 "Debug Remote JS"로 디버깅 모드 활성화

---

## 문제가 계속될 경우

1. **로그 캡처하여 공유**
   ```typescript
   // 모든 콘솔 로그를 파일로 저장
   console.log = (...args) => {
     // 로그를 파일이나 서비스로 전송
   };
   ```

2. **서버 로그 확인**
   - 백엔드 서버의 로그에서 요청이 도착했는지 확인

3. **네트워크 트래픽 확인**
   - Charles Proxy 또는 Wireshark 사용
   - 실제로 요청이 전송되는지 확인
