#!/bin/bash

# 환경 설정
export BASE_URL="http://localhost:8080"  # 또는 Railway URL

echo "🚀 벤치마크 시작: $BASE_URL"
echo ""

# 1. 로그인 (토큰 받기)
echo "📝 로그인 중..."
TOKEN=$(curl -X POST "$BASE_URL/api/user/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"u1@test.com","password":"password"}' \
  -s | jq -r '.bearerToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ 로그인 실패! 서버가 실행 중인지 확인하세요."
  exit 1
fi

echo "✅ 로그인 성공"
echo ""

# 2. 각 API 응답 시간 측정
echo "=== API 응답 시간 측정 ===" > benchmark.txt
echo "⏱️  측정 중..."

# 그룹 목록 조회
echo -n "그룹 목록: " >> benchmark.txt
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/groups"
done | awk '{sum+=$1} END {print sum/NR " 초"}' >> benchmark.txt
echo "  ✓ 그룹 목록 완료"

# 통계 조회
echo -n "통계 조회: " >> benchmark.txt
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/groups/1/statistics?year=2024&month=12"
done | awk '{sum+=$1} END {print sum/NR " 초"}' >> benchmark.txt
echo "  ✓ 통계 조회 완료"

# 지출 목록 조회
echo -n "지출 목록: " >> benchmark.txt
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/expenses?groupId=1"
done | awk '{sum+=$1} END {print sum/NR " 초"}' >> benchmark.txt
echo "  ✓ 지출 목록 완료"

echo ""
echo "📊 결과:"
cat benchmark.txt
