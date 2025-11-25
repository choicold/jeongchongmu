import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle, AlertCircle, X } from 'lucide-react-native';

type AlertType = 'success' | 'error' | 'info';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    onConfirm?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) throw new Error("useAlert must be used within an AlertProvider");
    return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertOptions>({ title: '', message: '', type: 'info' });

    const showAlert = (options: AlertOptions) => {
        setConfig({ type: 'info', ...options });
        setVisible(true);
    };

    const hideAlert = () => {
        setVisible(false);
        if (config.onConfirm) config.onConfirm();
    };

    // 타입별 아이콘 및 색상 설정
    const getTheme = () => {
        switch (config.type) {
            case 'success': return { color: '#10B981', icon: <CheckCircle size={48} color="#10B981" /> };
            case 'error': return { color: '#EF4444', icon: <AlertCircle size={48} color="#EF4444" /> };
            default: return { color: '#4F46E5', icon: <AlertCircle size={48} color="#4F46E5" /> };
        }
    };

    const theme = getTheme();

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.alertBox}>
                        <View style={styles.iconWrapper}>
                            {theme.icon}
                        </View>

                        <Text style={styles.title}>{config.title}</Text>
                        <Text style={styles.message}>{config.message}</Text>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.color }]}
                            onPress={hideAlert}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertBox: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconWrapper: {
        marginBottom: 16,
        padding: 10,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});