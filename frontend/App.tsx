import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { DataProvider } from './src/context/DataContext';
import { ToastProvider } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ChatAssistant } from './src/components/common';
import { setupNotificationHandler } from './src/services/NotificationPermissionService';

// 앱 시작 시 알림 핸들러 설정 (포그라운드 알림 표시)
setupNotificationHandler();

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <ToastProvider>
              <AppNavigator />
              <ChatAssistant />
            </ToastProvider>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </PaperProvider>
  );
}