#!/bin/bash

export BASE_URL="http://localhost:8080"

echo "🔥 테스트 데이터 생성 시작"
echo ""

# 1. 로그인
echo "🔑 로그인 중..."
LOGIN_RESPONSE=$(curl -X POST "$BASE_URL/api/user/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"u1@test.com","password":"password"}' \
  -s)

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.bearerToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.id')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ 로그인 실패!"
  exit 1
fi

if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
  echo "❌ User ID를 가져올 수 없습니다!"
  exit 1
fi

echo "✅ 로그인 성공"
echo "   User ID: $USER_ID"
echo ""

# 2. 그룹 확인/생성
echo "📦 그룹 정보 확인 중..."
GROUPS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/groups")
GROUP_ID=$(echo $GROUPS_RESPONSE | jq -r '.[0].id // empty')

if [ -z "$GROUP_ID" ] || [ "$GROUP_ID" == "null" ]; then
  echo "  ℹ️  그룹이 없어서 생성합니다..."
  
  CREATE_RESPONSE=$(curl -X POST "$BASE_URL/api/groups" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "테스트 그룹",
      "description": "벤치마크 테스트용 그룹"
    }' -s)
  
  GROUP_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
  echo "  ✅ 그룹 생성 완료 (ID: $GROUP_ID)"
else
  echo "  ✅ 기존 그룹 사용 (ID: $GROUP_ID)"
fi

echo ""

# 3. 테스트 1건 (디버깅용)
echo "🧪 테스트 지출 1건 생성..."

# ⭐ macOS 호환 방식으로 변경
TEST_RESPONSE_FILE=$(mktemp)
HTTP_CODE=$(curl -X POST "$BASE_URL/api/expenses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "%{http_code}" \
  -o "$TEST_RESPONSE_FILE" \
  -d "{
    \"groupId\": $GROUP_ID,
    \"payerId\": $USER_ID,
    \"title\": \"테스트\",
    \"amount\": 10000,
    \"expenseData\": \"2024-12-15T14:30:00\",
    \"participantIds\": [],
    \"items\": [
      {\"name\": \"항목1\", \"price\": 5000, \"quantity\": 1},
      {\"name\": \"항목2\", \"price\": 5000, \"quantity\": 1}
    ]
  }")

RESPONSE_BODY=$(cat "$TEST_RESPONSE_FILE")
rm -f "$TEST_RESPONSE_FILE"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ 테스트 성공! (HTTP $HTTP_CODE)"
  echo ""
else
  echo "❌ 테스트 실패! (HTTP $HTTP_CODE)"
  echo "응답: $RESPONSE_BODY"
  echo ""
  echo "💡 Spring 로그를 확인하세요!"
  exit 1
fi

# 4. 100개 생성
echo "💰 테스트 지출 100개 생성 중..."
SUCCESS=0
FAIL=0

for i in {1..100}; do
  MONTH=$((1 + RANDOM % 12))
  DAY=$((1 + RANDOM % 28))
  HOUR=$((9 + RANDOM % 12))
  MINUTE=$((RANDOM % 60))
  AMOUNT=$((10000 + RANDOM % 90000))
  
  TIMESTAMP=$(printf "2024-%02d-%02dT%02d:%02d:00" $MONTH $DAY $HOUR $MINUTE)
  
  # ⭐ 항목 합계 = 총액이 되도록 수정
  ITEM1_PRICE=$((AMOUNT / 2))
  ITEM2_PRICE=$((AMOUNT - ITEM1_PRICE))
  
  HTTP_CODE=$(curl -X POST "$BASE_URL/api/expenses" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -w "%{http_code}" \
    -o /dev/null \
    -s \
    -d "{
      \"groupId\": $GROUP_ID,
      \"payerId\": $USER_ID,
      \"title\": \"테스트 지출 $i\",
      \"amount\": $AMOUNT,
      \"expenseData\": \"$TIMESTAMP\",
      \"participantIds\": [],
      \"items\": [
        {\"name\": \"항목1\", \"price\": $ITEM1_PRICE, \"quantity\": 1},
        {\"name\": \"항목2\", \"price\": $ITEM2_PRICE, \"quantity\": 1}
      ]
    }")
  
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "  ✓ ${i}/100개 생성 중... (성공: $SUCCESS, 실패: $FAIL)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 테스트 데이터 생성 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📦 그룹 ID: $GROUP_ID"
echo "   👤 User ID: $USER_ID"
echo "   💰 생성된 지출: $SUCCESS개"
if [ $FAIL -gt 0 ]; then
  echo "   ⚠️  실패: $FAIL개"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔥 이제 벤치마크를 실행하세요!"
echo "   ./benchmark.sh"
