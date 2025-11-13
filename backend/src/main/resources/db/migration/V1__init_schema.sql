-- ===================================
-- 정총무 초기 스키마
-- ===================================
-- 작성일: 2025-10-16
-- 설명: 사용자, 그룹, 지출 기본 테이블 생성
-- ===================================

-- 타임존 설정
SET timezone = 'Asia/Seoul';

-- UUID 확장 (PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- 사용자 테이블
-- ===================================
CREATE TABLE IF NOT EXISTS users (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    bank_name VARCHAR(50),
    account_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                             );

CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS '사용자 정보';
COMMENT ON COLUMN users.id IS '사용자 고유 ID (UUID)';
COMMENT ON COLUMN users.email IS '이메일 (로그인 ID)';
COMMENT ON COLUMN users.password IS 'BCrypt 암호화된 비밀번호';

-- ===================================
-- 그룹 테이블
-- ===================================
CREATE TABLE IF NOT EXISTS groups (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                             );

CREATE INDEX idx_groups_creator ON groups(creator_id);

COMMENT ON TABLE groups IS '그룹(모임) 정보';

-- ===================================
-- 그룹 멤버 (N:M)
-- ===================================
CREATE TABLE IF NOT EXISTS group_members (
                                             user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                                                                   PRIMARY KEY (user_id, group_id)
    );

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

COMMENT ON TABLE group_members IS '그룹 멤버 관계 (N:M)';

-- ===================================
-- 지출 테이블
-- ===================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    receipt_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                            );

CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expenses_payer ON expenses(payer_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);

COMMENT ON TABLE expenses IS '지출 내역';
COMMENT ON COLUMN expenses.amount IS '금액 (원)';

-- ===================================
-- 개발용 테스트 데이터
-- ===================================
INSERT INTO users (email, password, name) VALUES
                                              ('admin@jeongchongmu.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '관리자'),
                                              ('user1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '테스트유저1'),
                                              ('user2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '테스트유저2')
    ON CONFLICT (email) DO NOTHING;