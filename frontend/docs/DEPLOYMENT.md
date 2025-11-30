# 배포 환경 설정 가이드

이 문서는 정총무 프로젝트를 팀원들과 공유하거나 배포할 때 필요한 환경 설정 방법을 설명합니다.

## 목차

1. [Firebase 설정 파일 관리](#1-firebase-설정-파일-관리)
2. [백엔드 키 파일 관리](#2-백엔드-키-파일-관리)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [팀원 온보딩 가이드](#4-팀원-온보딩-가이드)

---

## 1. Firebase 설정 파일 관리

### 1.1 iOS - GoogleService-Info.plist

**위치**: `ios/GoogleService-Info.plist` (프로젝트 루트에서 생성될 예정)

**설정 방법**:
1. Firebase Console에서 프로젝트 선택
2. 프로젝트 설정 → iOS 앱 → GoogleService-Info.plist 다운로드
3. 다운로드한 파일을 `ios/` 폴더에 복사

**팀원 공유 방법**:
- **Option A (권장)**: 암호화된 저장소 사용
  - Google Drive, Dropbox 등의 비공개 폴더에 업로드
  - 팀원에게 링크 공유 (접근 권한 제한)

- **Option B**: 환경 변수로 관리
  ```bash
  # .env 파일에 Firebase 설정 추가 (git에는 커밋하지 않음)
  FIREBASE_API_KEY=your-api-key
  FIREBASE_AUTH_DOMAIN=your-auth-domain
  # ... 기타 Firebase 설정
  ```

### 1.2 Android - google-services.json

**위치**: `android/app/google-services.json` (프로젝트 루트에서 생성될 예정)

**설정 방법**:
1. Firebase Console에서 프로젝트 선택
2. 프로젝트 설정 → Android 앱 → google-services.json 다운로드
3. 다운로드한 파일을 `android/app/` 폴더에 복사

**팀원 공유 방법**:
- iOS와 동일하게 암호화된 저장소 사용

---

## 2. 백엔드 키 파일 관리

### 2.1 Firebase Admin SDK 키 파일

**위치**: `backend/src/main/resources/firebase-adminsdk.json` (또는 유사한 경로)

**설정 방법**:
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드한 JSON 파일을 백엔드 프로젝트의 `resources/` 폴더에 복사
4. `application.yml` 또는 `application.properties`에서 파일 경로 설정:
   ```yaml
   firebase:
     credentials-path: classpath:firebase-adminsdk.json
   ```

**팀원 공유 방법**:
- **절대 Git에 커밋하지 마세요!**
- `.gitignore`에 추가:
  ```gitignore
  # Firebase Admin SDK
  **/firebase-adminsdk*.json
  ```
- 암호화된 저장소로 공유 (Google Drive, 1Password 등)

### 2.2 application-secrets.yml (선택 사항)

민감한 환경 변수를 별도 파일로 관리하는 경우:

```yaml
# application-secrets.yml (Git에 커밋하지 않음)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/jeongchongmu
    username: your-db-username
    password: your-db-password

jwt:
  secret: your-jwt-secret-key

firebase:
  credentials-path: classpath:firebase-adminsdk.json
```

---

## 3. 환경 변수 설정

### 3.1 프론트엔드 (React Native/Expo)

**방법 1: app.config.js 사용 (권장)**

`app.config.js` 파일에서 환경별로 API URL 설정:

```javascript
export default {
  expo: {
    // ...
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:8080',
      easProjectId: process.env.EAS_PROJECT_ID || 'your-project-id',
    },
  },
};
```

**방법 2: .env 파일 사용**

1. `react-native-dotenv` 설치:
   ```bash
   npm install react-native-dotenv
   ```

2. `.env` 파일 생성 (Git에 커밋하지 않음):
   ```
   API_URL=http://localhost:8080
   EAS_PROJECT_ID=your-project-id
   ```

3. `.env.example` 파일 생성 (Git에 커밋):
   ```
   API_URL=http://localhost:8080
   EAS_PROJECT_ID=your-project-id
   ```

### 3.2 백엔드 (Spring Boot)

**application.yml 예시**:

```yaml
spring:
  profiles:
    active: local  # local, dev, prod 등으로 구분

---
# Local 환경
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:postgresql://localhost:5432/jeongchongmu
    username: postgres
    password: password

---
# Production 환경
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DATABASE_URL}  # 환경 변수에서 읽음
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

---

## 4. 팀원 온보딩 가이드

### 4.1 신규 팀원 설정 체크리스트

새로운 팀원이 프로젝트에 합류할 때 다음 단계를 따르세요:

#### ✅ 프론트엔드 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-org/jeongchongmu.git
   cd jeongchongmu/frontend
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **Firebase 설정 파일 다운로드**
   - 팀 리더에게 요청하여 다음 파일 받기:
     - `ios/GoogleService-Info.plist`
     - `android/app/google-services.json`
   - 해당 경로에 파일 복사

4. **환경 변수 설정**
   - `.env.example`을 복사하여 `.env` 생성
   ```bash
   cp .env.example .env
   ```
   - 필요한 값 수정 (API URL, EAS Project ID 등)

5. **앱 실행**
   ```bash
   npx expo start
   ```

#### ✅ 백엔드 설정

1. **저장소 클론**
   ```bash
   cd jeongchongmu/backend
   ```

2. **Firebase Admin SDK 키 파일 다운로드**
   - 팀 리더에게 요청하여 `firebase-adminsdk.json` 파일 받기
   - `src/main/resources/` 폴더에 복사

3. **데이터베이스 설정**
   - PostgreSQL 설치 및 데이터베이스 생성
   ```sql
   CREATE DATABASE jeongchongmu;
   ```

4. **application-local.yml 설정**
   - 로컬 데이터베이스 정보 입력

5. **애플리케이션 실행**
   ```bash
   ./gradlew bootRun
   ```

### 4.2 알림 기능 테스트 방법

알림 기능을 테스트하려면 **실제 디바이스**가 필요합니다. (에뮬레이터/시뮬레이터 불가)

1. **iOS**:
   - Apple Developer 계정 필요
   - Xcode에서 Signing & Capabilities 설정
   - 실제 iPhone에서 테스트

2. **Android**:
   - Firebase Console에서 FCM 설정 확인
   - `google-services.json` 파일이 올바른 위치에 있는지 확인
   - 실제 Android 기기에서 테스트

---

## 5. 보안 주의사항

### ⚠️ Git에 커밋하지 말아야 할 파일들

```gitignore
# Firebase
google-services.json
GoogleService-Info.plist
firebase-adminsdk*.json

# 환경 변수
.env
.env.local
.env.production
application-secrets.yml

# 키 파일
*.p12
*.pem
*.key
keystore.jks
```

### ✅ Git에 커밋해야 할 파일들

```
.env.example
.gitignore
app.config.js (민감 정보 제외)
README.md
docs/DEPLOYMENT.md
```

---

## 6. 배포 시 추가 고려사항

### 6.1 Expo EAS Build

Expo Application Services (EAS)를 사용하여 앱을 빌드하는 경우:

1. **eas.json 설정**:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "API_URL": "https://api.jeongchongmu.com"
         }
       },
       "development": {
         "env": {
           "API_URL": "http://192.168.0.100:8080"
         }
       }
     }
   }
   ```

2. **Secrets 관리**:
   - EAS Secrets를 사용하여 환경 변수 안전하게 저장
   ```bash
   eas secret:create --name API_URL --value https://api.jeongchongmu.com
   ```

### 6.2 백엔드 배포 (예: AWS, Heroku)

배포 플랫폼의 환경 변수 설정 사용:

- **Heroku**:
  ```bash
  heroku config:set DATABASE_URL=postgresql://...
  heroku config:set JWT_SECRET=your-secret
  ```

- **AWS Elastic Beanstalk**:
  - 환경 속성(Environment Properties)에서 설정

- **Docker**:
  ```yaml
  # docker-compose.yml
  services:
    backend:
      environment:
        - DATABASE_URL=postgresql://db:5432/jeongchongmu
        - JWT_SECRET=${JWT_SECRET}
  ```

---

## 7. 문제 해결

### Firebase 설정 파일을 찾을 수 없음

**증상**: "GoogleService-Info.plist not found" 또는 "google-services.json missing"

**해결**:
1. Firebase Console에서 파일 다운로드
2. 올바른 경로에 파일 배치
3. Xcode/Android Studio 재시작

### FCM 토큰 등록 실패

**증상**: "FCM 토큰 등록 실패" 로그

**해결**:
1. 실제 디바이스에서 테스트 중인지 확인
2. Firebase 프로젝트 설정 확인
3. 알림 권한 허용 확인

### 서버 연결 실패

**증상**: "Network Error" 또는 "timeout"

**해결**:
1. 백엔드 서버가 실행 중인지 확인
2. `app.config.js`의 `apiUrl` 확인
3. 모바일 기기의 경우 로컬 IP 주소 사용 (예: `http://192.168.0.100:8080`)

---

## 8. 추가 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [React Native 공식 문서](https://reactnative.dev/)

---

## 문의

설정 중 문제가 발생하면 팀 리더 또는 다음 연락처로 문의하세요:
- GitHub Issues: https://github.com/your-org/jeongchongmu/issues
- 이메일: team@jeongchongmu.com
