import { Linking, Platform } from 'react-native';
import { showGlobalAlert } from '../contexts/CustomAlertContext';

/**
 * DeepLinkService - 외부 앱 연동 딥링크 서비스
 *
 * 토스, 카카오페이 등 외부 앱으로 이동하는 딥링크를 관리합니다.
 */

/**
 * 은행 이름 → 은행 코드 매핑
 * 한국 금융결제원 표준 은행 코드
 */
const BANK_CODE_MAP: { [key: string]: string } = {
  // 시중은행
  '한국은행': '001',
  '산업은행': '002',
  '기업은행': '003',
  'IBK기업은행': '003',
  '국민은행': '004',
  'KB국민은행': '004',
  '외환은행': '005',
  '수협은행': '007',
  '수협중앙회': '007',
  '농협은행': '011',
  'NH농협은행': '011',
  '농협중앙회': '012',
  '우리은행': '020',
  'SC제일은행': '023',
  '제일은행': '023',
  '한국씨티은행': '027',
  '씨티은행': '027',
  '대구은행': '031',
  '부산은행': '032',
  '광주은행': '034',
  '제주은행': '035',
  '전북은행': '037',
  '경남은행': '039',
  '새마을금고': '045',
  '신협중앙회': '048',
  '상호저축은행': '050',
  '신한은행': '088',
  '케이뱅크': '089',
  'K뱅크': '089',
  '카카오뱅크': '090',
  '토스뱅크': '092',
  // 증권사
  '한국투자증권': '240',
  '미래에셋증권': '238',
  '삼성증권': '240',
  'KB증권': '218',
  'NH투자증권': '247',
  '신한투자증권': '278',
};

/**
 * 은행 이름으로 은행 코드 조회
 * 매핑에 없으면 은행 이름 그대로 반환
 */
const getBankCode = (bankName: string): string => {
  return BANK_CODE_MAP[bankName] || bankName;
};

/**
 * 계좌번호에서 하이픈 제거
 */
const formatAccountNumber = (accountNumber: string): string => {
  return accountNumber.replace(/-/g, '');
};

/**
 * 토스 송금 화면으로 이동
 *
 * @param bankName - 수신자 은행명
 * @param accountNumber - 수신자 계좌번호 (하이픈 포함 가능, 자동으로 제거됨)
 * @param amount - 송금 금액
 * @param message - 송금 메시지 (선택)
 *
 * @example
 * ```typescript
 * DeepLinkService.openTossTransfer('카카오뱅크', '3333-1234-56789', 10000, '회식비 정산');
 * ```
 */
export const openTossTransfer = async (
  bankName: string,
  accountNumber: string,
  amount: number,
  message?: string
): Promise<void> => {
  try {
    // 계좌번호에서 하이픈 제거
    const formattedAccountNumber = formatAccountNumber(accountNumber);

    // 은행 코드 조회
    const bankCode = getBankCode(bankName);

    // 토스 송금 딥링크 URL 생성
    // 여러 파라미터 조합을 시도 (토스 공식 문서가 없어 실험적 접근)
    const params = new URLSearchParams({
      bankCode: bankCode, // 은행 코드 (3자리)
      bankName: encodeURIComponent(bankName), // 은행 이름
      bank: encodeURIComponent(bankName), // 은행 (대체 파라미터)
      accountNo: formattedAccountNumber,
      accountNumber: formattedAccountNumber, // 대체 파라미터
      amount: amount.toString(),
      ...(message && { msg: encodeURIComponent(message) }),
      ...(message && { message: encodeURIComponent(message) }),
    });

    const tossUrl = `supertoss://send?${params.toString()}`;

    // 직접 토스 앱 열기 시도 (canOpenURL 대신 직접 시도)
    try {
      await Linking.openURL(tossUrl);
    } catch (openError) {
      // 토스 앱이 설치되지 않은 경우
      console.log('토스 앱을 열 수 없습니다:', openError);
      showGlobalAlert({
        title: '토스 앱 필요',
        message: '토스 앱이 설치되어 있지 않습니다. 앱 스토어에서 설치하시겠습니까?',
        buttons: [
          { text: '취소', style: 'cancel' },
          {
            text: '설치하기',
            onPress: () => openTossAppStore(),
          },
        ],
      });
    }
  } catch (error: any) {
    console.error('토스 송금 실행 에러:', error);
    showGlobalAlert({
      title: '실행 실패',
      message: '토스 송금을 실행할 수 없습니다. 나중에 다시 시도해주세요.',
      type: 'error',
    });
  }
};

/**
 * 토스 앱 스토어로 이동
 */
export const openTossAppStore = async (): Promise<void> => {
  const appStoreUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/kr/app/toss/id839333328' // 토스 iOS 앱 ID
      : 'https://play.google.com/store/apps/details?id=viva.republica.toss'; // 토스 Android 패키지명

  try {
    const canOpen = await Linking.canOpenURL(appStoreUrl);
    if (canOpen) {
      await Linking.openURL(appStoreUrl);
    } else {
      showGlobalAlert({
        title: '오류',
        message: '앱 스토어를 열 수 없습니다.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('앱 스토어 열기 에러:', error);
    showGlobalAlert({
      title: '오류',
      message: '앱 스토어를 열 수 없습니다.',
      type: 'error',
    });
  }
};

/**
 * 카카오페이 송금 화면으로 이동
 *
 * @param accountNumber - 수신자 계좌번호
 * @param amount - 송금 금액
 */
export const openKakaopayTransfer = async (
  accountNumber: string,
  amount: number
): Promise<void> => {
  try {
    // 카카오페이 딥링크 (예시)
    const kakaopayUrl = `kakaopay://send?accountNo=${accountNumber}&amount=${amount}`;

    const canOpen = await Linking.canOpenURL(kakaopayUrl);

    if (canOpen) {
      await Linking.openURL(kakaopayUrl);
    } else {
      showGlobalAlert({
        title: '카카오페이 앱 필요',
        message: '카카오페이 앱이 설치되어 있지 않습니다.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('카카오페이 송금 실행 에러:', error);
    showGlobalAlert({
      title: '실행 실패',
      message: '카카오페이 송금을 실행할 수 없습니다.',
      type: 'error',
    });
  }
};

/**
 * 전화번호로 전화 걸기
 */
export const makePhoneCall = async (phoneNumber: string): Promise<void> => {
  const phoneUrl = `tel:${phoneNumber}`;

  try {
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      await Linking.openURL(phoneUrl);
    } else {
      showGlobalAlert({
        title: '오류',
        message: '전화를 걸 수 없습니다.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('전화 걸기 에러:', error);
    showGlobalAlert({
      title: '오류',
      message: '전화를 걸 수 없습니다.',
      type: 'error',
    });
  }
};

/**
 * 문자 메시지 보내기
 */
export const sendSMS = async (
  phoneNumber: string,
  message?: string
): Promise<void> => {
  const smsUrl = message
    ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
    : `sms:${phoneNumber}`;

  try {
    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    } else {
      showGlobalAlert({
        title: '오류',
        message: '문자를 보낼 수 없습니다.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('문자 보내기 에러:', error);
    showGlobalAlert({
      title: '오류',
      message: '문자를 보낼 수 없습니다.',
      type: 'error',
    });
  }
};

/**
 * 이메일 보내기
 */
export const sendEmail = async (
  email: string,
  subject?: string,
  body?: string
): Promise<void> => {
  let emailUrl = `mailto:${email}`;

  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  if (params.length > 0) {
    emailUrl += `?${params.join('&')}`;
  }

  try {
    const canOpen = await Linking.canOpenURL(emailUrl);
    if (canOpen) {
      await Linking.openURL(emailUrl);
    } else {
      showGlobalAlert({
        title: '오류',
        message: '이메일을 보낼 수 없습니다.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('이메일 보내기 에러:', error);
    showGlobalAlert({
      title: '오류',
      message: '이메일을 보낼 수 없습니다.',
      type: 'error',
    });
  }
};

/**
 * 외부 웹 브라우저로 URL 열기
 */
export const openURL = async (url: string): Promise<void> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      showGlobalAlert({
        title: '오류',
        message: 'URL을 열 수 없습니다.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('URL 열기 에러:', error);
    showGlobalAlert({
      title: '오류',
      message: 'URL을 열 수 없습니다.',
      type: 'error',
    });
  }
};
