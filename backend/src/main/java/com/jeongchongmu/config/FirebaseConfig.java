package com.jeongchongmu.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

/**
 * Firebase Cloud Messaging (FCM) 설정 클래스
 *
 * Firebase Admin SDK를 초기화하고 FCM 메시지를 전송할 수 있도록 설정합니다.
 *
 * 설정 방법:
 * 1. Firebase Console에서 서비스 계정 키(JSON) 다운로드
 * 2. 다운로드한 파일을 프로젝트 루트 또는 resources 디렉토리에 저장
 * 3. application.yml에 파일 경로 설정:
 *    firebase:
 *      credentials-path: /path/to/firebase-service-account.json
 *
 * @author Jeongchongmu Team
 */
@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    /**
     * Firebase Admin SDK 초기화
     *
     * 이 메서드는 애플리케이션 시작 시 자동으로 호출되어 Firebase를 초기화합니다.
     *
     * 초기화 실패 시에도 애플리케이션은 정상적으로 실행되며, 푸시 알림만 비활성화됩니다.
     *
     * @throws IOException Firebase 인증 파일을 읽는 데 실패한 경우
     */
    @PostConstruct
    public void initialize() {
        try {
            // Firebase가 이미 초기화되었는지 확인
            if (FirebaseApp.getApps().isEmpty()) {
                // 우선순위 1: 환경 변수에서 Firebase JSON 내용 직접 가져오기 (클라우드 환경)
                String credentialsJson = System.getenv("FIREBASE_CREDENTIALS_JSON");

                GoogleCredentials credentials;

                if (credentialsJson != null && !credentialsJson.isEmpty()) {
                    // JSON 문자열을 InputStream으로 변환
                    credentials = GoogleCredentials.fromStream(
                        new java.io.ByteArrayInputStream(credentialsJson.getBytes())
                    );
                    logger.info("✅ Firebase 인증 정보를 환경 변수(JSON)에서 로드했습니다.");
                } else {
                    // 우선순위 2: 파일 경로 사용 (로컬 개발 환경)
                    String credentialsPath = System.getenv("FIREBASE_CREDENTIALS_PATH");

                    if (credentialsPath == null || credentialsPath.isEmpty()) {
                        logger.warn("⚠️ Firebase 인증 정보가 설정되지 않았습니다.");
                        logger.warn("환경 변수 FIREBASE_CREDENTIALS_JSON 또는 FIREBASE_CREDENTIALS_PATH를 설정해주세요.");
                        logger.warn("푸시 알림 기능이 비활성화됩니다.");
                        return;
                    }

                    FileInputStream serviceAccount = new FileInputStream(credentialsPath);
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                    logger.info("✅ Firebase 인증 정보를 파일에서 로드했습니다: {}", credentialsPath);
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                FirebaseApp.initializeApp(options);
                logger.info("✅ Firebase Admin SDK 초기화 완료");
            } else {
                logger.info("✅ Firebase는 이미 초기화되어 있습니다.");
            }
        } catch (IOException e) {
            logger.error("❌ Firebase 초기화 실패: {}", e.getMessage(), e);
            logger.warn("푸시 알림 기능이 비활성화됩니다. 애플리케이션은 계속 실행됩니다.");
        }
    }

    /**
     * Firebase가 정상적으로 초기화되었는지 확인
     *
     * @return Firebase 초기화 여부
     */
    public static boolean isFirebaseInitialized() {
        return !FirebaseApp.getApps().isEmpty();
    }
}
