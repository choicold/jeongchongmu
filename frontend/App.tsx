import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { DataProvider } from './src/context/DataContext';
import { ToastProvider } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
}