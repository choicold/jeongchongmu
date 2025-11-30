/**
 * 비밀번호 검증 결과 타입
 */
export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 이메일 형식이 유효한지 검증합니다.
 *
 * @param email - 검증할 이메일 주소
 * @returns 유효하면 true, 아니면 false
 *
 * @example
 * ```typescript
 * const isValid = validateEmail("test@example.com");
 * console.log(isValid); // true
 *
 * const isInvalid = validateEmail("invalid-email");
 * console.log(isInvalid); // false
 * ```
 */
export const validateEmail = (email: string): boolean => {
  // 이메일 정규식 패턴
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    return false;
  }

  return emailRegex.test(email.trim());
};

/**
 * 비밀번호가 유효한지 검증합니다.
 *
 * 규칙:
 * - 최소 8자 이상
 * - 최소 1개의 영문자 포함
 * - 최소 1개의 숫자 포함
 *
 * @param password - 검증할 비밀번호
 * @returns 검증 결과 객체 { isValid, message }
 *
 * @example
 * ```typescript
 * const result = validatePassword("password123");
 * if (result.isValid) {
 *   console.log("유효한 비밀번호");
 * } else {
 *   console.log(result.message); // 에러 메시지 출력
 * }
 * ```
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      message: '비밀번호를 입력해주세요.',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: '비밀번호는 최소 8자 이상이어야 합니다.',
    };
  }

  // 영문자 포함 여부
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return {
      isValid: false,
      message: '비밀번호는 최소 1개의 영문자를 포함해야 합니다.',
    };
  }

  // 숫자 포함 여부
  const hasNumber = /[0-9]/.test(password);
  if (!hasNumber) {
    return {
      isValid: false,
      message: '비밀번호는 최소 1개의 숫자를 포함해야 합니다.',
    };
  }

  return {
    isValid: true,
  };
};

/**
 * 계좌번호 형식이 유효한지 검증합니다.
 *
 * @param accountNumber - 검증할 계좌번호
 * @returns 유효하면 true, 아니면 false
 *
 * @example
 * ```typescript
 * const isValid = validateAccountNumber("110-123-456789");
 * console.log(isValid); // true
 * ```
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  if (!accountNumber || accountNumber.trim().length === 0) {
    return false;
  }

  const trimmed = accountNumber.trim();

  // 숫자와 하이픈(-)만 허용
  const accountRegex = /^[0-9-]+$/;
  if (!accountRegex.test(trimmed)) {
    return false;
  }

  // 하이픈을 제거한 순수 숫자만 추출
  const numbersOnly = trimmed.replace(/-/g, '');

  // 계좌번호는 최소 10자리 이상이어야 함 (일반적으로 10~14자리)
  if (numbersOnly.length < 10 || numbersOnly.length > 20) {
    return false;
  }

  // 숫자만으로 이루어져 있는지 확인
  return /^\d+$/.test(numbersOnly);
};

/**
 * 이름이 유효한지 검증합니다.
 *
 * @param name - 검증할 이름
 * @returns 유효하면 true, 아니면 false
 *
 * @example
 * ```typescript
 * const isValid = validateName("홍길동");
 * console.log(isValid); // true
 * ```
 */
export const validateName = (name: string): boolean => {
  if (!name || name.trim().length === 0) {
    return false;
  }

  // 최소 2자, 최대 20자
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 20;
};

/**
 * 은행명이 유효한지 검증합니다.
 *
 * @param bankName - 검증할 은행명
 * @returns 유효하면 true, 아니면 false
 *
 * @example
 * ```typescript
 * const isValid = validateBankName("국민은행");
 * console.log(isValid); // true
 *
 * const isValid2 = validateBankName("KB뱅크");
 * console.log(isValid2); // true
 * ```
 */
export const validateBankName = (bankName: string): boolean => {
  if (!bankName || bankName.trim().length === 0) {
    return false;
  }

  const trimmedName = bankName.trim();

  // 최소 2자 이상
  if (trimmedName.length < 2) {
    return false;
  }

  // 주요 은행 목록 (은행, 뱅크, Bank 등 다양한 형식 포함)
  const validBankPatterns = [
    // 시중은행
    '국민은행', 'KB은행', 'KB뱅크', 'KB국민은행',
    '신한은행', '신한뱅크',
    '우리은행', '우리뱅크',
    '하나은행', '하나뱅크',
    'NH농협은행', '농협은행', 'NH은행',
    'IBK기업은행', '기업은행', 'IBK은행',
    'SC제일은행', '제일은행', 'SC은행',
    '씨티은행', '한국씨티은행', '시티은행',
    // 지방은행
    '부산은행', 'BNK부산은행',
    '대구은행', 'DGB대구은행',
    '경남은행', 'BNK경남은행',
    '광주은행',
    '전북은행', 'JB전북은행',
    '제주은행',
    // 특수은행
    '수협은행', '수협',
    '산림조합', '산림조합중앙회',
    // 인터넷은행
    '카카오뱅크', '카카오은행',
    '케이뱅크', 'K뱅크',
    '토스뱅크', '토스은행',
    // 저축은행 및 기타
    '새마을금고',
    '신협', '신용협동조합',
    '우체국',
    '저축은행',
  ];

  // 입력된 은행명이 유효한 은행 패턴 중 하나를 포함하는지 확인
  const isValidBank = validBankPatterns.some(pattern =>
    trimmedName.includes(pattern) || pattern.includes(trimmedName)
  );

  // 또는 '은행', '뱅크', 'Bank', '금고', '조합' 등의 키워드가 포함되어 있는지 확인
  const hasValidKeyword = /은행|뱅크|[Bb]ank|금고|조합|우체국/.test(trimmedName);

  return isValidBank || hasValidKeyword;
};
