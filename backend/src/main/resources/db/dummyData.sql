-- ============================================================
-- [1] 초기화: 기존 테이블 싹 삭제 (순서 중요, CASCADE로 의존성 무시)
-- ============================================================
DROP TABLE IF EXISTS settlement_details CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS expense_tags CASCADE;
DROP TABLE IF EXISTS expense_participants CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_votes CASCADE;
DROP TABLE IF EXISTS vote_options CASCADE;
DROP TABLE IF EXISTS votes CASCADE;

-- ============================================================
-- [2] 테이블 재생성 (ID 자동 증가 & BigInt 설정 완벽 적용)
-- ============================================================

-- 1. Users
CREATE TABLE users (
                       id bigserial PRIMARY KEY,
                       email varchar(255) NOT NULL UNIQUE,
                       password varchar(255) NOT NULL,
                       name varchar(255) NOT NULL,
                       fcm_token varchar(255),
                       bank_name varchar(255),
                       account_number varchar(255),
                       created_at timestamp(6),
                       updated_at timestamp(6)
);

-- 2. Groups
CREATE TABLE groups (
                        id bigserial PRIMARY KEY,
                        name varchar(255) NOT NULL,
                        description varchar(1000),
                        creator_id bigint NOT NULL,
                        invite_code varchar(255) UNIQUE,
                        created_at timestamp(6),
                        updated_at timestamp(6)
);

-- 3. GroupMembers
CREATE TABLE group_members (
                               id bigserial PRIMARY KEY,
                               group_id bigint NOT NULL,
                               user_id bigint NOT NULL,
                               role varchar(255) NOT NULL,
                               created_at timestamp(6),
                               updated_at timestamp(6),
                               CONSTRAINT uk_user_group UNIQUE (user_id, group_id)
);

-- 4. Tags
CREATE TABLE tags (
                      id bigserial PRIMARY KEY,
                      name varchar(255),
                      group_id bigint NOT NULL
);

-- 5. Expenses (Amount는 BigInt로 설정)
CREATE TABLE expenses (
                          id bigserial PRIMARY KEY,
                          group_id bigint NOT NULL,
                          payer_id bigint NOT NULL,
                          title varchar(255) NOT NULL,
                          amount bigint NOT NULL,
                          expense_data timestamp(6),
                          created_at timestamp(6),
                          updated_at timestamp(6)
);

-- 6. ExpenseItems
CREATE TABLE expense_items (
                               id bigserial PRIMARY KEY,
                               expense_id bigint NOT NULL,
                               name varchar(255) NOT NULL,
                               price bigint NOT NULL,
                               quantity integer NOT NULL
);

-- 7. ExpenseParticipants
CREATE TABLE expense_participants (
                                      expense_id bigint NOT NULL,
                                      user_id bigint NOT NULL,
                                      PRIMARY KEY (expense_id, user_id)
);

-- 8. ExpenseTags
CREATE TABLE expense_tags (
                              expense_id bigint NOT NULL,
                              tag_id bigint NOT NULL,
                              PRIMARY KEY (expense_id, tag_id)
);

-- 9. Settlements (정산 마스터)
CREATE TABLE settlements (
                             id bigserial PRIMARY KEY,
                             expense_id bigint NOT NULL UNIQUE,
                             method varchar(255) NOT NULL,
                             status varchar(255) NOT NULL,
                             deadline timestamp(6),
                             created_at timestamp(6),
                             updated_at timestamp(6)
);

-- 10. SettlementDetails (정산 상세)
CREATE TABLE settlement_details (
                                    id bigserial PRIMARY KEY,
                                    settlement_id bigint NOT NULL,
                                    debtor_id bigint NOT NULL,
                                    creditor_id bigint NOT NULL,
                                    amount bigint NOT NULL,
                                    is_sent boolean NOT NULL DEFAULT false,
                                    created_at timestamp(6),
                                    updated_at timestamp(6)
);

-- 11. Votes (투표 마스터)
CREATE TABLE votes (
                       id bigserial PRIMARY KEY,
                       expense_id bigint NOT NULL,
                       is_closed boolean NOT NULL DEFAULT false,
                       created_at timestamp(6),
                       updated_at timestamp(6)
);

-- 12. VoteOptions (투표 선택지)
CREATE TABLE vote_options (
                              id bigserial PRIMARY KEY,
                              vote_id bigint NOT NULL,
                              expense_item_id bigint NOT NULL
);

-- 13. UserVotes (사용자 투표 내역)
CREATE TABLE user_votes (
                            id bigserial PRIMARY KEY,
                            user_id bigint NOT NULL,
                            vote_option_id bigint NOT NULL,
                            created_at timestamp(6),
                            updated_at timestamp(6)
);

-- ============================================================
-- [3] 외래키(FK) 연결
-- ============================================================
ALTER TABLE groups ADD CONSTRAINT fk_groups_creator FOREIGN KEY (creator_id) REFERENCES users (id);
ALTER TABLE group_members ADD CONSTRAINT fk_gm_group FOREIGN KEY (group_id) REFERENCES groups (id);
ALTER TABLE group_members ADD CONSTRAINT fk_gm_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE tags ADD CONSTRAINT fk_tags_group FOREIGN KEY (group_id) REFERENCES groups (id);
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_group FOREIGN KEY (group_id) REFERENCES groups (id);
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_payer FOREIGN KEY (payer_id) REFERENCES users (id);
ALTER TABLE expense_items ADD CONSTRAINT fk_items_expense FOREIGN KEY (expense_id) REFERENCES expenses (id);
ALTER TABLE expense_participants ADD CONSTRAINT fk_ep_expense FOREIGN KEY (expense_id) REFERENCES expenses (id);
ALTER TABLE expense_participants ADD CONSTRAINT fk_ep_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE expense_tags ADD CONSTRAINT fk_et_expense FOREIGN KEY (expense_id) REFERENCES expenses (id);
ALTER TABLE expense_tags ADD CONSTRAINT fk_et_tag FOREIGN KEY (tag_id) REFERENCES tags (id);
ALTER TABLE settlements ADD CONSTRAINT fk_settlements_expense FOREIGN KEY (expense_id) REFERENCES expenses (id);
ALTER TABLE settlement_details ADD CONSTRAINT fk_sd_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (id);
ALTER TABLE settlement_details ADD CONSTRAINT fk_sd_debtor FOREIGN KEY (debtor_id) REFERENCES users (id);
ALTER TABLE settlement_details ADD CONSTRAINT fk_sd_creditor FOREIGN KEY (creditor_id) REFERENCES users (id);
ALTER TABLE votes ADD CONSTRAINT fk_votes_expense FOREIGN KEY (expense_id) REFERENCES expenses (id);
ALTER TABLE vote_options ADD CONSTRAINT fk_vo_vote FOREIGN KEY (vote_id) REFERENCES votes (id);
ALTER TABLE vote_options ADD CONSTRAINT fk_vo_item FOREIGN KEY (expense_item_id) REFERENCES expense_items (id);
ALTER TABLE user_votes ADD CONSTRAINT fk_uv_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE user_votes ADD CONSTRAINT fk_uv_option FOREIGN KEY (vote_option_id) REFERENCES vote_options (id);


-- ============================================================
-- [4] 데이터 채워넣기 (Mock Data)
-- ============================================================

-- 1. 유저 5명 생성 (은행 정보 포함)
INSERT INTO users (email, password, name, fcm_token, bank_name, account_number, created_at) VALUES
                                                                                                ('u1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '김지성', 'token_1', '토스뱅크', '1000-1111-2222', NOW()),
                                                                                                ('u2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '방경환', 'token_2', '카카오뱅크', '3333-44-555555', NOW()),
                                                                                                ('u3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '이선용', 'token_3', '국민은행', '123456-04-123456', NOW()),
                                                                                                ('u4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '최한기', 'token_4', '신한은행', '110-222-333333', NOW()),
                                                                                                ('u5@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '정총무', 'token_5', '농협은행', '302-1234-5678-91', NOW());

-- 2. 그룹 3개 생성
INSERT INTO groups (name, description, creator_id, invite_code, created_at) VALUES
                                                                                ('SOMA 15기', '소마 캡스톤 프로젝트 모임', 1, 'INVITE01', NOW()),
                                                                                ('맛집 탐방대', '맛있는거 먹으러 다니는 모임', 2, 'INVITE02', NOW()),
                                                                                ('제주도 여행', '12월 제주도 여행 정산방', 3, 'INVITE03', NOW());

-- 3. 그룹 멤버 자동 주입
INSERT INTO group_members (user_id, group_id, role, created_at)
SELECT u.id, g.id, 'MEMBER', NOW()
FROM users u CROSS JOIN groups g;

-- 4. 태그 생성
INSERT INTO tags (name, group_id)
SELECT t.name, g.id
FROM (VALUES ('식비'), ('교통'), ('숙박'), ('쇼핑'), ('술')) AS t(name)
         CROSS JOIN groups g;

-- 5. 지출 1000개 자동 생성
INSERT INTO expenses (group_id, payer_id, title, amount, expense_data, created_at)
SELECT
    floor(random() * 3 + 1)::bigint,
    floor(random() * 5 + 1)::bigint,
    (ARRAY['점심 식사', '저녁 회식', '스타벅스', '택시비', '숙소 결제', '이마트', '편의점', '비행기표', '렌트카'])[floor(random() * 9 + 1)],
    (floor(random() * 100 + 1) * 1000)::bigint,
    NOW() - (floor(random() * 30) || ' days')::interval,
    NOW()
FROM generate_series(1, 1000);

-- 6. 지출 연관 데이터 생성
INSERT INTO expense_items (expense_id, name, price, quantity)
SELECT id, title, amount, 1 FROM expenses;

INSERT INTO expense_participants (expense_id, user_id)
SELECT e.id, gm.user_id
FROM expenses e JOIN group_members gm ON e.group_id = gm.group_id;

INSERT INTO expense_tags (expense_id, tag_id)
SELECT e.id, (SELECT id FROM tags t WHERE t.group_id = e.group_id ORDER BY random() LIMIT 1)
FROM expenses e;

-- 7. 정산 데이터 생성 (1~800번 생성)
INSERT INTO settlements (expense_id, method, status, deadline, created_at)
SELECT
    id,
    'N_BUN_1',
    CASE WHEN random() > 0.2 THEN 'COMPLETED' ELSE 'PENDING' END,
    created_at + INTERVAL '7 days',
    created_at
FROM expenses
WHERE id <= 800;

-- 8. 정산 상세 데이터 생성
INSERT INTO settlement_details (settlement_id, debtor_id, creditor_id, amount, is_sent, created_at)
SELECT
    s.id,
    gm.user_id,
    e.payer_id,
    (e.amount / (SELECT COUNT(*) FROM group_members WHERE group_id = e.group_id))::bigint,
    (s.status = 'COMPLETED'),
    s.created_at
FROM settlements s
         JOIN expenses e ON s.expense_id = e.id
         JOIN group_members gm ON e.group_id = gm.group_id
WHERE gm.user_id != e.payer_id;

-- 9. ★ 투표 데이터 생성 (801~850번 지출에 대해 투표 생성) ★
INSERT INTO votes (expense_id, is_closed, created_at)
SELECT id, false, NOW()
FROM expenses
WHERE id BETWEEN 801 AND 850;

-- 10. ★ 투표 옵션 생성 (투표 방에 지출 항목 연결) ★
INSERT INTO vote_options (vote_id, expense_item_id)
SELECT v.id, ei.id
FROM votes v
         JOIN expense_items ei ON v.expense_id = ei.expense_id;

-- 11. ★ 사용자 투표 내역 생성 (랜덤 투표) ★
INSERT INTO user_votes (user_id, vote_option_id, created_at)
SELECT
    gm.user_id,
    vo.id,
    NOW()
FROM votes v
         JOIN group_members gm ON 1=1 -- (간단하게 모든 멤버가 투표했다고 가정)
         JOIN vote_options vo ON v.id = vo.vote_id
WHERE v.expense_id BETWEEN 801 AND 810; -- 10개 투표 방에 대해서만 투표 데이터 생성

-- ============================================================
-- [5] 시퀀스(번호표) 동기화
-- ============================================================
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('groups', 'id'), (SELECT MAX(id) FROM groups));
SELECT setval(pg_get_serial_sequence('group_members', 'id'), (SELECT MAX(id) FROM group_members));
SELECT setval(pg_get_serial_sequence('tags', 'id'), (SELECT MAX(id) FROM tags));
SELECT setval(pg_get_serial_sequence('expenses', 'id'), (SELECT MAX(id) FROM expenses));
SELECT setval(pg_get_serial_sequence('expense_items', 'id'), (SELECT MAX(id) FROM expense_items));
SELECT setval(pg_get_serial_sequence('settlements', 'id'), (SELECT MAX(id) FROM settlements));
SELECT setval(pg_get_serial_sequence('settlement_details', 'id'), (SELECT MAX(id) FROM settlement_details));
SELECT setval(pg_get_serial_sequence('votes', 'id'), (SELECT MAX(id) FROM votes));
SELECT setval(pg_get_serial_sequence('vote_options', 'id'), (SELECT MAX(id) FROM vote_options));
SELECT setval(pg_get_serial_sequence('user_votes', 'id'), (SELECT MAX(id) FROM user_votes));