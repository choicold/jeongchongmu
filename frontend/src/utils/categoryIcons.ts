/**
 * 카테고리별 아이콘(이모지) 반환 유틸리티
 *
 * 지출 제목이나 태그명을 기반으로 적절한 이모지를 반환합니다.
 * 모든 화면에서 일관성 있는 아이콘을 사용하기 위한 공통 유틸리티입니다.
 */
export const getCategoryEmoji = (titleOrTag: string): string => {
  const lowerText = titleOrTag.toLowerCase();

  // 음식/식사
  if (
    lowerText.includes('식사') ||
    lowerText.includes('음식') ||
    lowerText.includes('회식') ||
    lowerText.includes('점심') ||
    lowerText.includes('저녁') ||
    lowerText.includes('아침') ||
    lowerText.includes('밥')
  ) {
    return '🍽️';
  }

  // 카페/커피
  if (lowerText.includes('카페') || lowerText.includes('커피')) {
    return '☕';
  }

  // 교통
  if (
    lowerText.includes('교통') ||
    lowerText.includes('택시') ||
    lowerText.includes('버스') ||
    lowerText.includes('지하철')
  ) {
    return '🚗';
  }

  // 숙박
  if (lowerText.includes('숙박') || lowerText.includes('호텔')) {
    return '🏨';
  }

  // 쇼핑/장보기
  if (
    lowerText.includes('쇼핑') ||
    lowerText.includes('장보기') ||
    lowerText.includes('마트')
  ) {
    return '🛒';
  }

  // 영화/문화
  if (
    lowerText.includes('영화') ||
    lowerText.includes('공연') ||
    lowerText.includes('전시')
  ) {
    return '🎬';
  }

  // 운동/헬스
  if (
    lowerText.includes('운동') ||
    lowerText.includes('헬스') ||
    lowerText.includes('요가')
  ) {
    return '💪';
  }

  // 의료
  if (
    lowerText.includes('병원') ||
    lowerText.includes('약국') ||
    lowerText.includes('의료')
  ) {
    return '🏥';
  }

  // 기본 (돈/지출)
  return '💰';
};
