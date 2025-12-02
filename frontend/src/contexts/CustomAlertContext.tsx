import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert, { CustomAlertButton } from '../components/common/CustomAlert';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  type?: 'default' | 'error' | 'success' | 'warning' | 'info';
}

interface CustomAlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(
  undefined
);

// 전역 alert 함수 (컴포넌트 외부에서 사용)
let globalShowAlert: ((config: AlertConfig) => void) | null = null;

export const showGlobalAlert = (config: AlertConfig) => {
  if (globalShowAlert) {
    globalShowAlert(config);
  } else {
    console.error('CustomAlertProvider가 마운트되지 않았습니다.');
  }
};

export const useCustomAlert = () => {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within CustomAlertProvider');
  }
  return context;
};

interface CustomAlertProviderProps {
  children: React.ReactNode;
}

export const CustomAlertProvider: React.FC<CustomAlertProviderProps> = ({
  children,
}) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    // 애니메이션이 끝난 후 config를 초기화
    setTimeout(() => {
      setAlertConfig(null);
    }, 300);
  }, []);

  // 전역 alert 함수 설정
  React.useEffect(() => {
    globalShowAlert = showAlert;
    return () => {
      globalShowAlert = null;
    };
  }, [showAlert]);

  return (
    <CustomAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onDismiss={hideAlert}
        />
      )}
    </CustomAlertContext.Provider>
  );
};
