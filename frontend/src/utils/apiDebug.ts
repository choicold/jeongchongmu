import axios from 'axios';
import Constants from 'expo-constants';

/**
 * API 연결 테스트 유틸리티
 * 서버 연결 상태를 확인하고 디버깅 정보를 제공합니다.
 */

interface ConnectionTestResult {
  success: boolean;
  baseURL: string;
  message: string;
  details?: any;
  error?: string;
}

/**
 * API 서버 연결 테스트
 *
 * @param customURL - 테스트할 URL (선택사항, 기본값은 app.config.js의 설정)
 * @returns Promise<ConnectionTestResult> - 연결 테스트 결과
 *
 * @example
 * ```typescript
 * // 설정된 URL로 테스트
 * const result = await testAPIConnection();
 * console.log(result);
 *
 * // 커스텀 URL로 테스트
 * const result = await testAPIConnection('http://192.168.0.10:8080');
 * console.log(result);
 * ```
 */
export const testAPIConnection = async (
  customURL?: string
): Promise<ConnectionTestResult> => {
  const baseURL = customURL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

  console.log('🔍 API 연결 테스트 시작...');
  console.log('📍 테스트 URL:', baseURL);

  try {
    // 짧은 타임아웃으로 빠른 테스트
    const response = await axios.get(`${baseURL}/api/health`, {
      timeout: 5000,
      validateStatus: () => true, // 모든 상태 코드 허용
    });

    console.log('✅ 서버 응답 받음:', response.status);

    return {
      success: true,
      baseURL,
      message: `서버 연결 성공! (상태 코드: ${response.status})`,
      details: {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      },
    };
  } catch (error: any) {
    console.error('❌ 연결 테스트 실패:', error.message);

    let errorMessage = '서버 연결 실패';
    let suggestions: string[] = [];

    // 에러 타입별 분석
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = '타임아웃: 서버가 응답하지 않습니다';
      suggestions = [
        '서버가 실행 중인지 확인하세요',
        `API URL이 올바른지 확인하세요: ${baseURL}`,
        '네트워크 연결을 확인하세요',
      ];
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      errorMessage = '네트워크 에러: 서버에 연결할 수 없습니다';
      suggestions = [
        `서버 URL을 확인하세요: ${baseURL}`,
        '모바일에서는 localhost 대신 PC의 IP 주소를 사용하세요',
        '예: http://192.168.0.10:8080',
        '방화벽 설정을 확인하세요',
      ];
    } else if (error.response) {
      errorMessage = `서버 응답 에러: ${error.response.status} ${error.response.statusText}`;
      suggestions = [
        '서버가 올바르게 실행 중입니다',
        `하지만 ${error.response.status} 에러를 반환했습니다`,
      ];
    }

    console.log('💡 해결 방법:');
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });

    return {
      success: false,
      baseURL,
      message: errorMessage,
      error: error.message,
      details: {
        code: error.code,
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            }
          : undefined,
        suggestions,
      },
    };
  }
};

/**
 * 현재 네트워크 정보 출력
 * 개발 환경에서 디버깅에 유용한 정보를 콘솔에 출력합니다.
 */
export const printNetworkInfo = () => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

  console.log('\n═══════════════════════════════════');
  console.log('🌐 네트워크 디버깅 정보');
  console.log('═══════════════════════════════════');
  console.log('📍 API Base URL:', apiUrl);
  console.log('📱 Platform:', Constants.platform);
  console.log('🔧 Environment:', __DEV__ ? 'Development' : 'Production');

  if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    console.log('\n⚠️  경고: localhost를 사용 중입니다!');
    console.log('💡 모바일 기기/에뮬레이터에서는 PC의 IP 주소를 사용하세요:');
    console.log('   1. PC의 IP 주소를 확인하세요 (예: 192.168.0.10)');
    console.log('   2. .env 파일에 EXPO_PUBLIC_API_URL=http://YOUR_IP:8080 추가');
    console.log('   3. 앱을 재시작하세요');
  }

  console.log('═══════════════════════════════════\n');
};

/**
 * 회원가입 API 전용 연결 테스트
 * 실제 회원가입 엔드포인트에 더미 데이터로 연결 테스트
 * (400 에러가 예상되지만, 연결 자체는 성공)
 */
export const testSignupEndpoint = async (): Promise<ConnectionTestResult> => {
  const baseURL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

  console.log('🔍 회원가입 엔드포인트 테스트 시작...');
  console.log('📍 테스트 URL:', `${baseURL}/api/user/signup`);

  try {
    // 빈 데이터로 POST 요청 (실제 가입은 안 됨)
    const response = await axios.post(
      `${baseURL}/api/user/signup`,
      {},
      {
        timeout: 5000,
        validateStatus: () => true, // 모든 상태 코드 허용
      }
    );

    console.log('✅ 서버 응답 받음:', response.status);

    // 400은 정상 (서버가 작동 중이라는 의미)
    if (response.status === 400) {
      return {
        success: true,
        baseURL,
        message: '회원가입 엔드포인트 연결 성공! (서버가 정상 작동 중)',
        details: {
          status: response.status,
          note: '400 에러는 정상입니다 (빈 데이터로 테스트했기 때문)',
        },
      };
    }

    return {
      success: true,
      baseURL,
      message: `엔드포인트 응답 받음 (상태: ${response.status})`,
      details: { status: response.status, data: response.data },
    };
  } catch (error: any) {
    console.error('❌ 연결 테스트 실패:', error.message);

    return {
      success: false,
      baseURL,
      message: '회원가입 엔드포인트 연결 실패',
      error: error.message,
      details: {
        code: error.code,
        suggestion: error.code === 'ECONNABORTED'
          ? '서버가 응답하지 않습니다. 서버를 시작하세요.'
          : '네트워크 연결을 확인하세요.',
      },
    };
  }
};
