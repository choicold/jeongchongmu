import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALERT_WIDTH = SCREEN_WIDTH * 0.85;
const MAX_ALERT_WIDTH = 320;

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  onDismiss?: () => void;
  type?: 'default' | 'error' | 'success' | 'warning' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: '확인', style: 'default' }],
  onDismiss,
  type = 'default',
}) => {
  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'error':
        return COLORS.error;
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.text.primary;
    }
  };

  const getButtonStyle = (buttonStyle: CustomAlertButton['style']) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (buttonStyle: CustomAlertButton['style']) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  // 버튼 순서 정렬: destructive/default 버튼이 위, cancel 버튼이 아래
  const sortedButtons = [...buttons].sort((a, b) => {
    if (a.style === 'cancel' && b.style !== 'cancel') return 1;
    if (a.style !== 'cancel' && b.style === 'cancel') return -1;
    return 0;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
          <View style={styles.alertContainer}>
            <View style={styles.contentContainer}>
              <Text style={[styles.title, { color: getTitleColor() }]}>
                {title}
              </Text>
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}
            </View>

            <View style={styles.buttonsContainer}>
              {sortedButtons.map((button, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <View style={styles.buttonDivider} />}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      getButtonStyle(button.style),
                      sortedButtons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        getButtonTextStyle(button.style),
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.background.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: Math.min(ALERT_WIDTH, MAX_ALERT_WIDTH),
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  singleButton: {
    flex: 1,
  },
  buttonDivider: {
    height: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButton: {
    backgroundColor: COLORS.primary,
  },
  defaultButtonText: {
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: COLORS.background.secondary,
  },
  cancelButtonText: {
    color: COLORS.text.primary,
  },
  destructiveButton: {
    backgroundColor: COLORS.error,
  },
  destructiveButtonText: {
    color: COLORS.white,
  },
});

export default CustomAlert;
