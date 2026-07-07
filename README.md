# 정총무

## 1. 한 줄 소개

정총무는 2025.09-12 캡스톤디자인 프로젝트로, 모임 지출과 정산을 함께 관리하는 그룹 가계부 서비스입니다.

## 2. 팀 구성

| 이름 | 담당 |
| --- | --- |
| 이선용 | 지출 도메인, OCR 파이프라인, AI Agent |
| 최한기 | 그룹, 알림, 프론트 |
| 김지성 | 정산, 투표 |
| 방경환 | 로그인, 통계, 프론트 |

## 3. 기술 스택

| 영역 | 기술 |
| --- | --- |
| Backend | Java 21, Spring Boot 3.5.6, Spring Data JPA, Spring Security, JWT, Spring AI |
| Database | PostgreSQL, Flyway |
| AI/OCR | OpenAI GPT-4o, Gemini 2.5 Flash OCR |
| Storage/Notification | Supabase Storage, Firebase Admin SDK, Expo Push Notification |
| Frontend | Expo 54, React Native 0.81, React 19, TypeScript, React Navigation, React Native Paper |
| API/Docs | REST API, Swagger/OpenAPI |
| Deploy | Railway, Docker Compose for local DB |

## 4. 핵심 코드 경로

| 코드 | 경로 | 역할 |
| --- | --- | --- |
| ExpenseService | `backend/src/main/java/com/jeongchongmu/domain/expense/ExpenseService.java` | 지출 생성, 수정, 삭제, 조회와 총액-품목 합계 검증, 그룹 멤버십 및 수정/삭제 권한 검증 |
| McpChatController | `backend/src/main/java/com/jeongchongmu/mcp/McpChatController.java` | AI Agent 채팅 엔드포인트, 시스템 프롬프트, Tool Calling 연결 |
| SettlementAiTools | `backend/src/main/java/com/jeongchongmu/mcp/tools/SettlementAiTools.java` | 자연어 기반 N빵, 직접, 비율, 항목별 정산 Tool 정의 |
| DateTimeAiTools | `backend/src/main/java/com/jeongchongmu/mcp/tools/DateTimeAiTools.java` | 날짜, 기간, 월 정보 계산 Tool 정의 |
| GeminiOcrService | `backend/src/main/java/com/jeongchongmu/domain/OCR/service/GeminiOcrService.java` | Gemini 기반 영수증 OCR 요청, 응답 정리, JSON 파싱 |

## 5. 재현 절차

1. `backend/src/main/resources/application.yml`에서 사용하는 환경 변수 값을 `.env` 또는 실행 환경에 설정한다. 주요 키는 `SPRING_PROFILE`, DB 접속 정보, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`이다.
2. 로컬 DB가 필요하면 저장소 루트에서 `docker-compose up -d`로 PostgreSQL을 실행한다.
3. Java 21 환경에서 `cd backend && ./gradlew bootRun`으로 백엔드를 실행한다.
4. 프론트는 `cd frontend && npm install && npm start` 후 Expo Go 또는 Expo web으로 확인한다.
5. 현재 운영 서버는 내려간 상태이며, 앱 동작 기록은 캡스톤 결과 보고서를 참고한다.
