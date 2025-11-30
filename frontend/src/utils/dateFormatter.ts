/**
 * ISO 8601 날짜 문자열을 "YYYY년 MM월 DD일" 형식으로 변환합니다.
 *
 * @param isoString - ISO 8601 형식의 날짜 문자열 (예: "2025-01-15T10:30:00Z")
 * @returns 포맷된 날짜 문자열 (예: "2025년 1월 15일")
 *
 * @example
 * ```typescript
 * const formatted = formatDate("2025-01-15T10:30:00Z");
 * console.log(formatted); // "2025년 1월 15일"
 * ```
 */
export const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return isoString; // 유효하지 않은 날짜면 원본 반환
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0부터 시작하므로 +1
    const day = date.getDate();

    return `${year}년 ${month}월 ${day}일`;
  } catch (error) {
    console.error('날짜 포맷 변환 실패:', error);
    return isoString;
  }
};

/**
 * ISO 8601 날짜 문자열을 "YYYY-MM-DD HH:mm" 형식으로 변환합니다.
 *
 * @param isoString - ISO 8601 형식의 날짜 문자열 (예: "2025-01-15T10:30:00Z")
 * @returns 포맷된 날짜시간 문자열 (예: "2025-01-15 10:30")
 *
 * @example
 * ```typescript
 * const formatted = formatDateTime("2025-01-15T10:30:00Z");
 * console.log(formatted); // "2025-01-15 10:30"
 * ```
 */
export const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return isoString; // 유효하지 않은 날짜면 원본 반환
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('날짜시간 포맷 변환 실패:', error);
    return isoString;
  }
};

/**
 * 상대 시간 표시 (예: "3일 전", "방금 전")
 *
 * @param isoString - ISO 8601 형식의 날짜 문자열
 * @returns 상대 시간 문자열
 *
 * @example
 * ```typescript
 * const relative = formatRelativeTime("2025-01-15T10:30:00Z");
 * console.log(relative); // "3일 전"
 * ```
 */
export const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return '방금 전';
    } else if (diffMin < 60) {
      return `${diffMin}분 전`;
    } else if (diffHour < 24) {
      return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
      return `${diffDay}일 전`;
    } else {
      return formatDate(isoString);
    }
  } catch (error) {
    console.error('상대 시간 변환 실패:', error);
    return isoString;
  }
};
