import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Clipboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Users, ChevronLeft, ChevronRight, BarChart3, Receipt, Plus, UserPlus, Crown, Copy } from 'lucide-react-native';
import { MOCK_MEMBERS, api, MOCK_EXPENSES } from '../api/client'; // MOCK_EXPENSES import 추가
import { useAlert } from '../components/CustomAlert';

// GroupDetailScreen에 필요한 타입 정의 (App.tsx에서 group 객체를 받을 때 사용)
interface GroupType {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    creator: { name: string };
    createdAt: string;
}

interface GroupDetailScreenProps {
    group: GroupType;
    onBack: () => void;
    onGoToStats: (date: Date) => void;
    onGoToMembers: (group: GroupType) => void;
    onExpenseClick: (id: number, title: string) => void;
    // [추가] 지출 등록 화면으로 이동하는 함수
    onRegisterExpense: () => void;
    token: string | null;
}

// 지출 아이템 타입 정의
interface ExpenseItem {
    id: number;
    title: string;
    amount: number;
    payerName: string;
    expenseData: string; // ISO 8601 string
    category: string;
}

/**
 * 모임 상세 정보 및 지출 목록 화면
 */
export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ group, onBack, onGoToStats, onGoToMembers, onExpenseClick, onRegisterExpense, token }) => {
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    // 현재는 Mock 데이터 기준으로 2025년 11월을 기본값으로 설정
    const [currentDate, setCurrentDate] = useState(new Date("2025-11-01"));
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    // --- 지출 목록 API 호출 함수 ---
    const fetchExpenses = useCallback(async () => {
        if (!token || !group.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // API 호출 시 그룹 ID와 현재 연월 정보를 함께 전달할 수도 있지만,
            // 현재 api.getExpenses는 groupId만 받으므로 그대로 사용합니다.
            const data = await api.getExpenses(token, group.id);

            if (Array.isArray(data)) {
                setExpenses(data);
            } else {
                // API 응답이 배열이 아니거나 비어있을 경우 Mock 데이터 사용
                setExpenses(MOCK_EXPENSES[group.id] || []);
                console.warn("API가 배열을 반환하지 않았거나 오류입니다. Mock 데이터 사용.");
            }
        } catch (error: any) {
            console.error("지출 목록 로드 실패:", error);
            // 에러 발생 시에도 Mock 데이터를 사용하여 UI를 깨뜨리지 않도록 방어합니다.
            setExpenses(MOCK_EXPENSES[group.id] || []);
            showAlert({
                title: "데이터 로드 오류",
                message: error.message || "지출 목록을 불러오지 못했습니다.",
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [token, group.id, showAlert]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);


    // 현재 월 필터링 및 정렬 로직 (클라이언트 측 처리)
    const filtered = expenses.filter((e) => {
        const d = new Date(e.expenseData);
        // Date 객체의 getMonth()는 0부터 시작 (0=1월, 11=12월)
        const isSameYear = d.getFullYear() === currentDate.getFullYear();
        const isSameMonth = d.getMonth() === currentDate.getMonth();
        return isSameYear && isSameMonth;
    }).sort((a, b) => new Date(b.expenseData).getTime() - new Date(a.expenseData).getTime()); // 최신 순 정렬

    // 총액 계산
    const total = filtered.reduce((sum: number, e: any) => sum + e.amount, 0);

    // 날짜별 그룹화
    // [중요] acc 타입을 명시하여 grouped 객체가 올바른 타입을 가지도록 함
    const grouped = filtered.reduce((acc: { [key: string]: ExpenseItem[] }, e: ExpenseItem) => {
        const d = new Date(e.expenseData);
        const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(e);
        return acc;
    }, {});

    /**
     * 월 변경 핸들러
     * @param delta -1 (이전 달), 1 (다음 달)
     */
    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
        // 월이 변경되어도 API 호출은 필요 없지만, 필요 시 여기서 fetchExpenses()를 다시 호출할 수 있습니다.
        // 현재는 클라이언트에서 필터링만 수행합니다.
    };

    const handleGoToStats = () => {
        if (onGoToStats) {
            onGoToStats(currentDate);
        }
    };

    const handleGoToMembers = () => {
        if (onGoToMembers) {
            onGoToMembers(group);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            {/* 파란색 헤더 */}
            <View style={[styles.blueHeaderBg, { paddingTop: insets.top }]}>
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={onBack} style={styles.navBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                        <ArrowLeft color="#FFF" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.navTitle} numberOfLines={1}>{group.name}</Text>
                    <TouchableOpacity onPress={handleGoToMembers} style={styles.navBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                        <Users color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.blueHeaderContent}>
                    {/* 데코레이션 서클 */}
                    <View style={styles.decoCircle1} pointerEvents="none" />
                    <View style={styles.decoCircleLeft} pointerEvents="none" />

                    {/* 월 이동 네비게이션 */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={() => changeMonth(-1)}><ChevronLeft color="rgba(255,255,255,0.7)" size={28} /></TouchableOpacity>
                        <Text style={styles.monthText}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)}><ChevronRight color="rgba(255,255,255,0.7)" size={28} /></TouchableOpacity>
                    </View>

                    {/* 총 지출 및 분석 버튼 */}
                    <TouchableOpacity onPress={handleGoToStats} activeOpacity={0.8} style={{ zIndex: 20 }}>
                        <View style={styles.totalLabelRow}>
                            <Text style={styles.totalLabel}>총 지출</Text>
                            <View style={styles.analysisBadge}><BarChart3 size={12} color="#FFF"/><Text style={styles.analysisText}>분석 보기</Text><ChevronRight size={12} color="#FFF"/></View>
                        </View>
                        <Text style={styles.totalValue}>{total.toLocaleString()}원</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 지출 리스트 */}
            <ScrollView style={styles.listScrollView} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.whiteListCard}>
                    <View style={styles.listTitleRow}><Receipt size={16} color="#4F46E5" /><Text style={styles.listTitle}>지출 내역</Text></View>

                    {loading ? <ActivityIndicator color="#4F46E5" style={{marginTop:20}} /> :
                        filtered.length === 0 ? (
                            <View style={styles.emptyState}><Receipt size={32} color="#D1D5DB"/><Text style={styles.emptyText}>이 달의 지출이 없어요</Text></View>
                        ) : (
                            Object.entries(grouped).map(([date, items]) => (
                                <View key={date}>
                                    {/* 날짜 구분선 */}
                                    <View style={styles.dateRow}><Text style={styles.dateText}>{date}</Text></View>
                                    {/* 지출 항목 목록 */}
                                    {items.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.expenseItem}
                                            activeOpacity={0.8}
                                            onPress={() => onExpenseClick(item.id, item.title)}
                                        >
                                            <View style={styles.row}>
                                                {/* 결제자 이니셜 아바타 */}
                                                <View style={styles.expenseAvatar}>
                                                    <Text style={styles.expenseAvatarText}>{item.payerName[0]}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.expenseTitle}>{item.title}</Text>
                                                    <Text style={styles.expenseSub}>{item.payerName} 결제</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.expenseAmount}>-{item.amount.toLocaleString()}원</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))
                        )
                    }
                </View>
            </ScrollView>
            {/* 지출 추가 버튼 (FAB) */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={onRegisterExpense}>
                <Plus color="white" size={28} />
            </TouchableOpacity>
        </View>
    );
};

// --- 그룹 멤버 화면 ---

// API 응답 구조에 맞춘 멤버 타입 정의
interface MemberUser {
    id: number;
    name: string;
}

interface GroupMember {
    id: number;
    user: MemberUser;
    role: 'OWNER' | 'MEMBER';
    joinedAt: string;
}

interface GroupMembersScreenProps {
    group: GroupType;
    onBack: () => void;
    token: string | null; // API 호출을 위한 토큰 추가
}

/**
 * 모임 멤버 목록 화면
 */
export const GroupMembersScreen: React.FC<GroupMembersScreenProps> = ({ group, onBack, token }) => {
    const insets = useSafeAreaInsets();
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    // 멤버 아바타 색상 생성 유틸리티
    const getMemberColor = (id: number) => {
        const colors = [
            { bg: '#DBEAFE', text: '#1E40AF' }, // Blue
            { bg: '#DCFCE7', text: '#166534' }, // Green
            { bg: '#FEF3C7', text: '#92400E' }, // Yellow
            { bg: '#FEE2E2', text: '#991B1B' }, // Red
            { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
            { bg: '#F3E8FF', text: '#6B21A8' }, // Purple
        ];
        return colors[id % colors.length];
    };

    // API 멤버 목록 조회
    useEffect(() => {
        const fetchMembers = async () => {
            if (!token || !group.id) return;

            setLoading(true);
            try {
                const data = await api.getGroupMembers(token, group.id);
                if (Array.isArray(data)) {
                    setMembers(data);
                } else {
                    console.warn("멤버 데이터 형식 오류: 배열이 아닙니다.");
                }
            } catch (error) {
                console.error("멤버 목록 로드 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [token, group.id]);

    // [추가] 초대 코드 복사 로직
    const handleInvite = async () => {
        if (!token || !group.id) return;

        try {
            // 1. 그룹 상세 정보 API 호출하여 초대 코드 가져오기
            const groupDetail = await api.getGroupDetail(token, group.id);

            if (groupDetail && groupDetail.inviteCode) {
                // 2. 클립보드 복사 (React Native Clipboard 사용)
                Clipboard.setString(groupDetail.inviteCode);

                // 3. 성공 알림
                showAlert({
                    title: "초대 코드 복사 완료!",
                    message: `초대 코드: ${groupDetail.inviteCode}\n친구에게 공유해 보세요.`,
                    type: 'success'
                });
            } else {
                showAlert({ title: "오류", message: "초대 코드를 찾을 수 없습니다.", type: 'error' });
            }
        } catch (error: any) {
            console.error("초대 코드 로드 실패:", error);
            showAlert({ title: "오류", message: "초대 코드를 불러오지 못했습니다.", type: 'error' });
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.headerSimple}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}><ArrowLeft color="#000" size={24} /></TouchableOpacity>
                <Text style={styles.headerTitleSimple}>멤버 ({members.length})</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <ScrollView style={{ padding: 20 }}>
                    {/* 멤버 초대 카드 - 클릭 시 handleInvite 실행 */}
                    <TouchableOpacity style={styles.inviteCard} activeOpacity={0.7} onPress={handleInvite}>
                        <View style={styles.row}>
                            <View style={styles.inviteIcon}><UserPlus size={20} color="#9CA3AF"/></View>
                            <View>
                                <Text style={styles.inviteText}>새 멤버 초대하기</Text>
                                <Text style={styles.inviteSubText}>초대 코드 복사하기</Text>
                            </View>
                        </View>
                        <Copy size={20} color="#4F46E5"/>
                    </TouchableOpacity>

                    {/* 멤버 목록 */}
                    {members.map((m) => {
                        const { bg, text } = getMemberColor(m.user.id);
                        return (
                            <View key={m.id} style={styles.memberItem}>
                                <View style={styles.row}>
                                    {/* 멤버 이니셜 아바타 */}
                                    <View style={[styles.memberAvatar, { backgroundColor: bg }]}>
                                        <Text style={{ color: text, fontWeight: 'bold' }}>{m.user.name[0]}</Text>
                                    </View>
                                    <View>
                                        {/* 멤버 이름 및 모임장 표시 */}
                                        <View style={styles.row}>
                                            <Text style={styles.memberName}>{m.user.name}</Text>
                                            {m.role === 'OWNER' && <Crown size={14} color="#EAB308" fill="#EAB308" style={{marginLeft: 4}}/>}
                                        </View>
                                        <Text style={styles.memberRole}>
                                            {m.role === 'OWNER' ? '모임장' : '멤버'} • {new Date(m.joinedAt).toLocaleDateString()} 가입
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    // 단순 헤더 (멤버 목록 화면 등에서 사용)
    headerSimple: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFF' },
    headerTitleSimple: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
    backButton: { paddingRight: 10 }, // 뒤로가기 버튼 터치 영역 보강

    // 파란색 그룹 상세 헤더
    blueHeaderBg: { backgroundColor: '#4F46E5', paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', position: 'relative' },
    topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, zIndex: 10 },
    navBtn: { padding: 8 },
    navTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    blueHeaderContent: { paddingHorizontal: 24, marginTop: 10, paddingBottom: 20 },

    // 데코레이션 스타일 (약한 흰색 원)
    decoCircle1: { position: 'absolute', top: -50, right: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: -1 },
    decoCircleLeft: { position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)', zIndex: -1 },

    // 월 이동 네비게이션
    monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    monthText: { color: '#FFF', fontSize: 18, fontWeight: '600' },

    // 총 지출 관련 스타일
    totalLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { color: '#E0E7FF', fontSize: 14, fontWeight: '600' },
    analysisBadge: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center', gap: 4 },
    analysisText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    totalValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginTop: 8 },

    // 지출 리스트 영역
    listScrollView: { flex: 1, marginTop: -30 },
    whiteListCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, paddingBottom: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 5, paddingTop: 10, overflow: 'hidden' },
    listTitleRow: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center', gap: 8 },
    listTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },

    // 지출 없음 상태
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', marginTop: 8 },

    // 날짜 그룹 구분선
    dateRow: { backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingVertical: 8 },
    dateText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },

    // 지출 항목 스타일
    expenseItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    expenseAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    expenseAvatarText: { color: '#4F46E5', fontWeight: 'bold' },
    expenseTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    expenseSub: { fontSize: 12, color: '#9CA3AF' },
    expenseAmount: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    row: { flexDirection: 'row', alignItems: 'center' },

    // FAB (Floating Action Button)
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#4F46E5', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, elevation: 8, zIndex: 999 },

    // 멤버 초대 카드
    inviteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 10, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    inviteIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12 },
    inviteText: { fontSize: 14, fontWeight: 'bold', color: '#4B5563' },
    inviteSubText: { fontSize: 12, color: '#4F46E5', marginTop: 2, fontWeight: '600' }, // [추가] 초대 코드 복사 안내 텍스트

    // 멤버 항목 스타일
    memberItem: { padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#F3F4F6' },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    memberName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginRight: 6 },
    memberRole: { fontSize: 12, color: '#6B7280' }
});