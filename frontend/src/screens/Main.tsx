// src/screens/Main.tsx
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet,
    KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator, ViewStyle, TextStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// [수정] Group 아이콘 대신 Sparkles(반짝임/생성) 아이콘 사용
import { LogOut, Users, Plus, ArrowLeft, Sparkles, BookOpen, Bike, Utensils } from 'lucide-react-native';
// 상대 경로 import
import { InputField, PrimaryButton } from '../components/ui';
import { api } from '../api/client';
import { useAlert } from '../components/CustomAlert';

// --- Helper: 에러 메시지 변환 (Auth.tsx와 동일하게 복사) ---
/**
 * API 호출 시 발생한 에러 객체를 사용자 친화적인 메시지로 변환합니다.
 * @param error 에러 객체
 * @returns 사용자에게 보여줄 친절한 메시지
 */
const getFriendlyErrorMessage = (error: any) => {
    const msg = error.message || "";
    if (msg.includes("Network request failed")) return "서버와 연결할 수 없어요.\n네트워크를 확인해주세요.";
    if (msg.includes("500")) return "서버에 잠시 문제가 생겼어요.\n잠시 후 다시 시도해주세요. 🔧";
    if (msg.includes("403")) return "권한이 없습니다. 다시 로그인해주세요.";
    return "요청 처리에 실패했어요.\n(" + msg.slice(0, 30) + (msg.length > 30 ? '...' : '') + ")";
};

// --- 타입 정의 (GroupDetail.tsx의 GroupType을 재사용하거나 정의) ---
interface GroupType {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    creator: { name: string };
    createdAt: string;
}

interface MainScreenProps {
    onLogout: () => void;
    onNavigate: (screen: 'main' | 'createGroup') => void;
    groups: GroupType[];
    onGroupClick: (group: GroupType) => void;
    onRefresh: () => void;
    refreshing: boolean;
}

// --- 메인 화면 (그룹 목록) ---
export const MainScreen: React.FC<MainScreenProps> = ({ onLogout, onNavigate, groups, onGroupClick, onRefresh, refreshing }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* 헤더 */}
            <View style={styles.mainHeader}>
                <View>
                    <Text style={styles.headerTitle}>내 모임</Text>
                    <Text style={styles.headerSubtitle}>함께하는 금융 생활</Text>
                </View>
                {/* 로그아웃 버튼 */}
                <TouchableOpacity onPress={onLogout} style={styles.iconButton}>
                    <LogOut color="#4B5563" size={20} />
                </TouchableOpacity>
            </View>

            {/* 그룹 리스트 */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                // Pull-to-refresh 기능
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                }
            >
                {groups.length === 0 && !refreshing ? (
                    <View style={styles.emptyState}>
                        <Users size={40} color="#D1D5DB" />
                        <Text style={styles.emptyText}>아직 참여 중인 모임이 없어요.</Text>
                        <Text style={styles.emptySubText}>아래 버튼을 눌러 새로운 모임을 만들어보세요!</Text>
                    </View>
                ) : (
                    groups.map((group) => (
                        <TouchableOpacity
                            key={group.id}
                            style={styles.card}
                            onPress={() => onGroupClick(group)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{group.name}</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>ID: {group.id}</Text>
                                </View>
                            </View>
                            <Text style={styles.cardDesc} numberOfLines={2}>{group.description || "설명이 없습니다."}</Text>
                            <View style={styles.cardFooter}>
                                <View style={styles.row}>
                                    <Users size={14} color="#6B7280" />
                                    <Text style={styles.footerText}>{group.memberCount}명</Text>
                                </View>
                                {/* 날짜 포맷팅 */}
                                <Text style={styles.footerText}>
                                    개설: {new Date(group.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* FAB (그룹 생성 버튼) */}
            <TouchableOpacity style={styles.fab} onPress={() => onNavigate('createGroup')} activeOpacity={0.8}>
                <Plus color="white" size={28} />
            </TouchableOpacity>
        </View>
    );
};

// --- 그룹 생성 화면 (디자인 보강) ---

interface CreateGroupScreenProps {
    onNavigate: (screen: 'main' | 'createGroup') => void;
    onGroupCreated: () => void; // 그룹 생성 후 목록 새로고침을 요청하는 콜백
    token: string | null;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ onNavigate, onGroupCreated, token }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    const handleCreate = async () => {
        if (!name) {
            showAlert({ title: '잠깐만요!', message: '모임 이름을 입력해주세요.', type: 'error' });
            return;
        }
        if (!token) {
            showAlert({ title: '인증 오류', message: '로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            // [API] 실제 그룹 생성 요청
            await api.createGroup({ name, description }, token);

            showAlert({
                title: "생성 완료 🎉",
                message: "새로운 모임이 성공적으로 만들어졌어요!",
                type: 'success',
                onConfirm: () => {
                    if(onGroupCreated) onGroupCreated(); // 목록 새로고침 요청
                    onNavigate('main');
                }
            });
        } catch (error: any) {
            const friendlyMsg = getFriendlyErrorMessage(error);
            showAlert({ title: "모임 생성 오류", message: friendlyMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* 헤더 */}
                <View style={styles.headerSimple}>
                    <TouchableOpacity onPress={() => onNavigate('main')} style={styles.backButton}><ArrowLeft color="#000" size={24} /></TouchableOpacity>
                    <Text style={styles.headerTitleSimple}>새 모임 만들기</Text>
                </View>

                {/* 폼 입력 */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>

                    {/* [추가] 시각적 강조를 위한 아이콘 섹션 */}
                    <View style={styles.groupCreateIconSection}>
                        <View style={styles.groupCreateIconBox}>
                            {/* [수정] Group -> Sparkles 아이콘으로 변경하여 '생성/시작' 느낌 강조 */}
                            <Sparkles color="#4F46E5" size={40} fill="#E0E7FF" />
                        </View>
                        <Text style={styles.groupCreateTitle}>어떤 모임을 만드시겠어요?</Text>
                        <Text style={styles.groupCreateSubtitle}>모임의 목적과 설명을 입력하여 개설을 완료해 보세요.</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.label}>모임 이름 (필수)</Text>
                        <InputField
                            icon={<BookOpen size={20} color="#6B7280"/>}
                            value={name}
                            onChange={setName}
                            placeholder="모임 이름 (예: 독서 모임, 라이딩 팟)"
                        />

                        <Text style={styles.label}>모임 설명 (선택)</Text>
                        <InputField
                            icon={<Utensils size={20} color="#6B7280"/>}
                            value={description}
                            onChange={setDescription}
                            placeholder="모임에 대한 간단한 설명"
                        />

                        <View style={{ marginTop: 30 }}>
                            <PrimaryButton title="모임 개설하기" onPress={handleCreate} loading={loading} />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    // 메인 화면 헤더 스타일
    mainHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    headerSubtitle: { color: '#6B7280', fontSize: 13 },
    iconButton: { width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, padding: 20 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 16 },
    emptySubText: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },

    // 그룹 카드 스타일
    card: { backgroundColor: '#FFF', padding: 20, marginHorizontal: 20, marginBottom: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    badge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#4F46E5', fontSize: 10, fontWeight: 'bold' },

    cardDesc: { color: '#6B7280', marginBottom: 16, fontSize: 13 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F9FAFB', paddingTop: 16, marginTop: 4 },
    footerText: { color: '#9CA3AF', fontSize: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#4F46E5', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOpacity: 0.4, elevation: 8, zIndex: 999 },

    // --- 그룹 생성 화면 스타일 ---
    headerSimple: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFF' },
    headerTitleSimple: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
    backButton: { paddingRight: 10 },

    // 폼 컨테이너 (아이콘 섹션과 분리)
    formContainer: {
        marginTop: 20,
    },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },

    // [추가] 모임 생성 아이콘 및 제목 섹션 스타일
    groupCreateIconSection: {
        alignItems: 'center',
        paddingVertical: 30, // 상하 패딩 추가
        backgroundColor: '#F9FAFB', // 연한 배경색
        borderRadius: 24,
        marginBottom: 20,
    },
    groupCreateIconBox: {
        width: 80, height: 80,
        backgroundColor: '#E0E7FF', // 연한 보라색 배경
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    groupCreateTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    groupCreateSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20,
    }
});