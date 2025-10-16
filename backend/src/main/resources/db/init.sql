-- 타임존 설정
SET timezone = 'Asia/Seoul';

-- UUID v7 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 개발용 테스트 사용자 (BCrypt 암호화된 'password')
-- 실제 도메인 패키지 설계 후 Flyway로 관리 예정

COMMENT ON DATABASE jeongchongmu_dev IS '정총무 개발 데이터베이스';