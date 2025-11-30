import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from '../components/common/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

/**
 * ToastProvider - Toast Context Provider
 *
 * 앱 전역에서 Toast 메시지를 표시할 수 있도록 합니다.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        visible={toast.visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

/**
 * useToast 훅
 *
 * Toast를 표시하기 위한 커스텀 훅입니다.
 *
 * @example
 * ```tsx
 * import { useToast } from '../context/ToastContext';
 *
 * function MyComponent() {
 *   const { showToast } = useToast();
 *
 *   const handleSuccess = () => {
 *     showToast('성공적으로 저장되었습니다!', 'success');
 *   };
 *
 *   const handleError = () => {
 *     showToast('오류가 발생했습니다.', 'error');
 *   };
 *
 *   return (
 *     <View>
 *       <Button onPress={handleSuccess} title="성공" />
 *       <Button onPress={handleError} title="에러" />
 *     </View>
 *   );
 * }
 * ```
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
