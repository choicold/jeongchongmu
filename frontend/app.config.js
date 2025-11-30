export default {
    expo: {
      name: "정총무",
      slug: "jeongchongmu",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.jeongchongmu.app",
        googleServicesFile: "./GoogleService-Info.plist"
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        package: "com.jeongchongmu.app",
        googleServicesFile: "./google-services.json"
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      plugins: [
        [
          "expo-notifications",
          {
            icon: "./assets/icon.png",
            color: "#ffffff",
            sounds: [],
            mode: "production"
          }
        ]
      ],
      extra: {
        apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://jeongchongmu.up.railway.app",
        eas: {
          projectId: "2ebf0f98-62a4-43e3-b373-80c86a032c20"
        }
      }
    }
  };