import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Mail, Users, CreditCard, Hash, ArrowLeft } from 'lucide-react-native';
import { InputField, PrimaryButton } from '../components/ui';
import { api } from '../api/client';
import { useAlert } from '../components/CustomAlert';

// --- [Helper] 친절한 에러 메시지 변환기 ---
const getFriendlyErrorMessage = (error: any) => {
    const msg = error.message || "";

    if (msg.includes("Network request failed") || msg.includes("서버에 연결할 수 없습니다")) {
        return "서버와 연결할 수 없어요.\n와이파이가 연결되어 있는지 확인해주세요.";
    }
    if (msg.includes("timeout")) return "요청 시간이 초과되었어요.\n잠시 후 다시 시도해주세요.";
    if (msg.includes("500")) return "서버에 잠시 문제가 생겼어요.\n개발팀이 열심히 고치고 있어요! 🔧";
    if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("자격 증명에 실패")) {
        return "이메일 또는 비밀번호가 일치하지 않아요.";
    }
    if (msg.includes("403")) return "접근 권한이 없습니다.";

    return "로그인에 실패했어요.\n(Error: " + msg.slice(0, 20) + "...)";
};

// --- 로그인 화면 ---
export const LoginScreen = ({ onNavigate, onLoginSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // 로딩 상태 추가
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    const handleLogin = async () => {
        // 1. 입력값 확인
        if (!email || !password) {
            showAlert({ title: '입력 확인', message: '이메일과 비밀번호를 입력해주세요.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            // 2. 실제 API 호출 (POST /api/user/login)
            const response = await api.login({ email, password });

            // 3. 응답 확인 (스웨거: { "bearerToken": "..." })
            if (response && response.bearerToken) {
                console.log("로그인 성공! 토큰:", response.bearerToken);
                // 메인 화면으로 이동 (토큰 전달)
                onLoginSuccess(response.bearerToken);
            } else {
                // 토큰이 없는 경우 에러 처리
                throw new Error("서버 응답에 인증 토큰이 없습니다.");
            }

        } catch (error: any) {
            console.error("로그인 에러:", error);
            const friendlyMsg = getFriendlyErrorMessage(error);
            showAlert({ title: '로그인 실패', message: friendlyMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1}}
        >
            <ScrollView contentContainerStyle={[styles.scrollCenterContainer, {paddingTop: insets.top}]}>
                <View style={styles.centerContent}>
                    <View style={styles.logoBox}>
                        <Lock color="#4F46E5" size={32} />
                    </View>
                    <Text style={styles.title}>다시 오셨군요!</Text>
                    <Text style={styles.subtitle}>서비스 이용을 위해 로그인해주세요.</Text>

                    <View style={styles.form}>
                        <InputField
                            icon={<Mail size={20} color="#6B7280"/>}
                            value={email}
                            onChange={setEmail}
                            placeholder="이메일"
                            keyboardType="email-address"
                        />
                        <InputField
                            icon={<Lock size={20} color="#6B7280"/>}
                            value={password}
                            onChange={setPassword}
                            placeholder="비밀번호"
                            secureTextEntry
                        />
                        <PrimaryButton
                            title="로그인하기"
                            onPress={handleLogin}
                            loading={loading}
                        />
                    </View>

                    <TouchableOpacity onPress={() => onNavigate('signup')} style={styles.linkButton}>
                        <Text style={styles.linkText}>아직 계정이 없으신가요? <Text style={styles.linkHighlight}>회원가입</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// --- 회원가입 화면 (기존 유지) ---
export const SignupScreen = ({ onNavigate }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    const handleRegister = async () => {
        if (!email || !password || !name || !bankName || !accountNumber) {
            showAlert({ title: '잠깐만요!', message: '모든 항목을 빠짐없이 입력해주세요.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await api.signup({ email, password, name, bankName, accountNumber });

            showAlert({
                title: '가입 환영해요! 🎉',
                message: '회원가입이 완료되었습니다.\n이제 로그인을 진행해주세요.',
                type: 'success',
                onConfirm: () => onNavigate('login')
            });

        } catch (error: any) {
            const friendlyMsg = getFriendlyErrorMessage(error);
            showAlert({ title: '앗, 문제가 생겼어요', message: friendlyMsg, type: 'error' });
            console.error("Signup Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.headerSimple}>
                    <TouchableOpacity onPress={() => onNavigate('login')}>
                        <ArrowLeft color="#1F2937" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={{ marginBottom: 30 }}>
                        <Text style={styles.title}>계정 만들기</Text>
                        <Text style={styles.subtitle}>안전한 금융 생활의 시작</Text>
                    </View>

                    <View style={styles.form}>
                        <InputField icon={<Mail size={20} color="#6B7280"/>} value={email} onChange={setEmail} placeholder="이메일" keyboardType="email-address"/>
                        <InputField icon={<Lock size={20} color="#6B7280"/>} value={password} onChange={setPassword} placeholder="비밀번호" secureTextEntry />
                        <InputField icon={<Users size={20} color="#6B7280"/>} value={name} onChange={setName} placeholder="이름" />

                        <View style={{flexDirection: 'row', gap: 10}}>
                            <View style={{flex: 1}}>
                                <InputField icon={<CreditCard size={20} color="#6B7280"/>} value={bankName} onChange={setBankName} placeholder="은행명" />
                            </View>
                        </View>
                        <InputField icon={<Hash size={20} color="#6B7280"/>} value={accountNumber} onChange={setAccountNumber} placeholder="계좌번호" keyboardType="numeric" />

                        <PrimaryButton title="회원가입 완료" onPress={handleRegister} loading={loading} />
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scrollCenterContainer: { flexGrow: 1, justifyContent: 'center' },
    centerContent: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
    scrollContent: { padding: 24 },
    logoBox: {
        width: 64, height: 64,
        backgroundColor: '#E0E7FF',
        borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 24, fontWeight: 'bold',
        color: '#111827', marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 14, color: '#6B7280',
        marginBottom: 32, textAlign: 'center'
    },
    form: { gap: 16, width: '100%' },
    linkButton: { marginTop: 24, alignSelf: 'center' },
    linkText: { color: '#6B7280' },
    linkHighlight: { color: '#4F46E5', fontWeight: 'bold' },
    headerSimple: { flexDirection: 'row', alignItems: 'center', padding: 16 },
});