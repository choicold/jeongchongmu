# 📝 정총무 개발 환경 세팅 가이드

```
프로젝트명: 정총무
설명: 그룹 지출 관리 및 정산 서비스
```

---

## 📑 목차

1. [개발 환경](#-개발-환경)
2. [Backend 세팅](#-Backend-세팅)
3. [Frontend 세팅](#-Frontend-세팅)
4. [개발 워크플로우](#-개발-워크플로우)
5. [배포](#-배포)

---

## 🛠 개발 환경

### **필수 설치 프로그램**

| 도구 | 버전 | 용도 | 다운로드 |
|------|------|------|----------|
| Java | 21+ | Backend 개발 | [다운로드](https://adoptium.net/) |
| Node.js | 20+ | Frontend 개발 | [다운로드](https://nodejs.org/) |
| Docker Desktop | Latest | 로컬 DB | [다운로드](https://www.docker.com/products/docker-desktop) |
| Git | Latest | 버전 관리 | [다운로드](https://git-scm.com/) |

### **권장 도구**

| 도구 | 용도 |
|------|------|
| IntelliJ IDEA | Backend 개발 IDE |
| VS Code | Frontend 개발 IDE |
| DBeaver | 데이터베이스 관리 | -> 요건 알아서 세팅하세요.
| Postman | API 테스트 |

---
### **1. Git Clone**

```bash
# Repository 클론
git clone https://github.com/choicold/jeongchongmu.git
cd jeongchongmu

# 브랜치 확인
git branch -a
```

### **2. 프로젝트 구조 확인**

```
jeongchongmu/
├── backend/           # Spring Boot 백엔드
├── frontend/          # React Native 프론트엔드
├── docekr-compose.yml # docker local DB 세팅 -> 백엔드 안에 넣어도 됨. 처음에 세팅 잘못해놔서 요건 선택적으로 하세요. 어차피 로컬에서 쓰는거니까
├── .github/           # GitHub Actions CI
├── .env               # 노션에 있음. 복사해서 vi .env로 생성
└── README.md
```

---

## Backend 세팅

### **Step 1: 환경변수 설정**

```bash
# backend/.env 파일 생성 -> 노션에 있음
cd backend
vi .env
```

### **Step 2: 로컬 PostgreSQL 실행**

#### **Docker Compose**

```bash
# root repository에서 입력
docker-compose up -d

# 확인
docker ps
```

### **Step 3: 빌드 & 실행**

#### **IntelliJ IDEA 사용 시:**

```
1. IntelliJ에서 backend 폴더 열기
2. Gradle 동기화 대기
3. Run → Edit Configurations
4. Spring Boot 설정 추가:
  4-1. Spring Boot 설정 local:
     - Main class: com.jeongchongmu.BackendApplication
     - Active profiles: local
     - Environment variables: (파일 경로) backend/.env
  4-2. Spring Boot 설정 supabase(공유 DB):
     - Main class: com.jeongchongmu.BackendApplication
     - Active profiles: shared
     - Environment variables: (파일 경로) backend/.env
5. Run 버튼 클릭
```

### **Step 4: 확인**

```bash
# Health Check
curl http://localhost:8080/actuator/health

# 응답 예시:
# {"status":"UP"}

# Swagger UI 접속
open http://localhost:8080/swagger-ui/index.html
```

---

## Frontend 세팅

### **Step 1: 환경변수 설정**

```bash
# frontend/.env 파일 생성 -> 노션에 있음
cd frontend
vi .env
```

### **Step 2: 의존성 설치**

```bash
cd frontend

# npm 사용
npm install
```

### **Step 3: 어플 실행**
선수 조건: Expo Go 어플을 미리 다운 받기

```bash
# 어플에 나타나는 화면 확인
npm start

# 나타나는 QR 코드 스캔 -> 어플로 자동으로 들어가서 "정총무 개발 환경 세팅"이라 나오면 성공
```
---

## 💻 개발 워크플로우

### **1. 브랜치 전략**

```bash
main       # 운영 환경 (Railway 자동 배포)
  ↑
develop    # 개발 통합 브랜치 -> 10/20일 기준 아직 미생성 개발 시작 시 생성 필요
  ↑
feature/*  # 기능 개발 브랜치
```

### **2. 새 기능 개발 시작**

```bash
# develop 브랜치에서 최신 코드 받기
git checkout develop
git pull origin develop

# 새 기능 브랜치 생성
git checkout -b feature/user-login

# 작업 후 커밋
git add .
git commit -m "feat: Implement user login API"

# Push
git push origin feature/user-login
```

### **3. Pull Request 생성** --> 요건 할지 말지 협의

```
1. GitHub에서 Pull Request 생성
2. Base: develop ← Compare: feature/user-login
3. 제목과 설명 작성
4. Reviewers 지정 (팀원)
5. Create Pull Request
```

### **4. 코드 리뷰 & 머지** -> 요것도 할지말지 협의

```
1. 팀원이 코드 리뷰
2. GitHub Actions CI 자동 실행
   - Backend 테스트
   - Frontend 빌드
3. 모든 체크 통과 후 Merge
```

### **5. Commit Convention**

```bash
# 형식: <type>: <subject>

feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 설정, 패키지 매니저 수정

# 예시:
git commit -m "feat: 유저 인증 API 추가"
git commit -m "fix: 로그인 에러 해결"
git commit -m "docs: README 수정"
```

---

## 🚢 배포

### **자동 배포 (Railway)**

```
main 브랜치에 Push → Railway 자동 배포

배포 URL: https://jeongchongmu-production.up.railway.app
```

### **배포 확인**

```bash
# Health Check
curl https://jeongchongmu-production.up.railway.app/actuator/health

# Swagger UI
open https://jeongchongmu-production.up.railway.app/swagger-ui/index.html
```

### **배포 환경 접근** -> 이메일 알려주면 초대할께요

```
Railway Dashboard:
→ https://railway.app

로그인 후:
→ jeongchongmu 프로젝트 선택
→ Deployments에서 로그 확인
```

---

## 🔗 링크

| 항목 | URL |
|------|-----|
| GitHub Repository | https://github.com/choicold/jeongchongmu |
| Railway Dashboard | https://railway.app |
| Supabase Dashboard | https://supabase.com |
| API 문서 (Swagger) | http://localhost:8080/swagger-ui/index.html |
| 운영 서버 | https://jeongchongmu-production.up.railway.app |

---

## 👥 팀원

| 이름 | 역할 | GitHub |
|------|------|--------|
| 김지성 | 백엔드 | [@Kjs-ssu](https://github.com/Kjs-ssu) |
| 방경환 | 백엔드 | [@Bangkyunghwan](https://github.com/Bangkyunghwan) |
| 이선용 | 백엔드 | [@nametwo](https://github.com/nametwo) |
| 최한기 | 백엔드 | [@choicold](https://github.com/choicold) |
