// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, BackHandler, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
// [필수] 안전 영역(Safe Area) 설정을 위한 Provider
import { SafeAreaProvider } from 'react-native-safe-area-context';

// [Import] 분리한 화면(Screen)과 데이터 불러오기
import { LoginScreen, SignupScreen } from './src/screens/Auth';
import { MainScreen, CreateGroupScreen } from './src/screens/Main';
import { GroupDetailScreen, GroupMembersScreen } from './src/screens/GroupDetail';
import { StatisticsScreen } from './src/screens/Statistics';
import { ExpenseDetailScreen } from './src/screens/ExpenseDetail';
import { ExpenseRegisterScreen } from './src/screens/ExpenseRegister'; // [추가] 지출 등록 화면
import { AlertProvider } from './src/components/CustomAlert';

// API & Storage
import { api, INITIAL_MOCK_GROUPS } from './src/api/client';
import { getToken, saveToken, removeToken } from './src/api/storage';

// --- Type Definitions ---
// [수정] expenseRegister 화면 추가
type ScreenName = 'login' | 'signup' | 'main' | 'createGroup' | 'detail' | 'members' | 'stats' | 'expenseDetail' | 'expenseRegister';

interface GroupType {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    creator: { name: string };
    createdAt: string;
}

// 선택된 지출 정보 타입
interface SelectedExpenseType {
    id: number;
    title: string;
}

export default function App() {
    // Nav History: ['login'] or ['main', 'detail', 'stats'] 등 화면 스택 관리
    const [history, setHistory] = useState<ScreenName[]>([]);

    // 현재 선택된 그룹 (detail, members, stats 화면에 전달)
    const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);

    // 현재 선택된 지출 (지출 상세 화면에 전달)
    const [selectedExpense, setSelectedExpense] = useState<SelectedExpenseType | null>(null);

    // 그룹 목록 상태
    const [groups, setGroups] = useState<GroupType[]>([]);

    // Pull-to-refresh 로딩 상태
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 통계 화면으로 전달할 날짜 상태
    const [statsDate, setStatsDate] = useState(new Date());

    // 앱 초기 로딩 상태 (토큰 체크 중)
    const [isLoading, setIsLoading] = useState(true);

    // 인증 토큰 상태
    const [authToken, setAuthToken] = useState<string | null>(null);

    // --- 1. 그룹 목록 불러오기 (API 연동) ---
    const fetchGroups = useCallback(async (token: string) => {
        let finalData: GroupType[] = [];
        try {
            setIsRefreshing(true);
            console.log("그룹 목록 갱신 중...");
            const data: any = await api.getGroups(token);

            if (Array.isArray(data)) {
                finalData = data as GroupType[];
            } else {
                console.warn("그룹 데이터가 배열이 아니거나 응답이 비어있습니다. Mock 데이터를 사용합니다.");
                finalData = INITIAL_MOCK_GROUPS as GroupType[];
            }
        } catch (error) {
            console.error("그룹 목록 로드 실패 (네트워크/서버 오류):", error);
            finalData = INITIAL_MOCK_GROUPS as GroupType[]; // 실패 시 Mock 데이터 사용
        } finally {
            // 원본 배열 변경 방지 및 최신순 정렬 (내림차순)
            const sortedData = finalData
                .slice() // 배열의 안전한 복사본 생성
                .sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

            setGroups(sortedData); // 정렬된 데이터로 State 업데이트
            setIsRefreshing(false);
        }
    }, []);

    // --- 2. 앱 실행 시 자동 로그인 & 데이터 로드 ---
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const savedToken = await getToken();
                if (savedToken) {
                    console.log("자동 로그인 성공");
                    setAuthToken(savedToken);
                    setHistory(['main']);
                    // 백그라운드에서 그룹 목록 로드 시작 (로딩 인디케이터는 이미 숨김)
                    fetchGroups(savedToken);
                } else {
                    setHistory(['login']);
                }
            } catch (e) {
                console.error("자동 로그인 체크 실패:", e);
                setHistory(['login']);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, [fetchGroups]);

    // --- 3. 안드로이드 뒤로가기 핸들링 ---
    useEffect(() => {
        const handleBackPress = () => {
            if (history.length > 1) {
                setHistory(prev => prev.slice(0, -1)); // 히스토리에서 가장 최근 항목 제거
                return true; // 뒤로가기 동작 처리 완료
            }
            // 최상위 화면 (main 또는 login)일 경우, 앱을 종료하도록 false 반환 (기본 동작)
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => subscription.remove();
    }, [history]);

    // --- 4. 네비게이션 함수들 ---
    const navigate = (screenName: ScreenName) => setHistory(prev => [...prev, screenName]);
    const goBack = () => { if (history.length > 1) setHistory(prev => prev.slice(0, -1)); };
    const replace = (screenName: ScreenName) => setHistory([screenName]); // 히스토리 초기화 후 새 화면으로 이동

    // --- 5. 인증/그룹 관리 핸들러 ---
    const handleLoginSuccess = async (token: string) => {
        await saveToken(token); // SecureStore 저장
        setAuthToken(token);
        replace('main');
        fetchGroups(token); // 로그인 직후 데이터 로드
    };

    const handleLogout = async () => {
        await removeToken(); // SecureStore 삭제
        setAuthToken(null);
        setGroups([]); // 데이터 비우기
        setSelectedGroup(null); // 선택된 그룹 초기화
        replace('login');
    };

    // 현재 화면 이름 추출
    const currentScreen = history[history.length - 1] || 'login';

    // 6. 화면 렌더링 함수
    const renderScreen = () => {
        switch(currentScreen) {
            case 'login':
                return <LoginScreen onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;

            case 'signup':
                return <SignupScreen onNavigate={goBack} />; // 회원가입 완료 후 goBack으로 login 화면 복귀

            case 'main':
                return (
                    <MainScreen
                        onLogout={handleLogout}
                        onNavigate={navigate}
                        groups={groups}
                        onGroupClick={(g: GroupType) => { setSelectedGroup(g); navigate('detail'); }}
                        refreshing={isRefreshing}
                        onRefresh={() => authToken && fetchGroups(authToken)}
                    />
                );

            case 'createGroup':
                return (
                    <CreateGroupScreen
                        onNavigate={goBack} // 생성 후 main 화면으로 복귀
                        token={authToken}
                        onGroupCreated={() => authToken && fetchGroups(authToken)} // 생성 완료 시 목록 갱신
                    />
                );

            case 'detail':
                return (
                    <GroupDetailScreen
                        group={selectedGroup!} // selectedGroup이 null일 가능성은 없지만, 타입스크립트 에러 방지
                        token={authToken}
                        onBack={() => { goBack(); setSelectedGroup(null); }} // 뒤로 가기 시 selectedGroup 초기화
                        onGoToStats={(d: Date) => { setStatsDate(d); navigate('stats'); }}
                        onGoToMembers={() => navigate('members')}
                        // 지출 항목 클릭 시 상세 페이지로 이동
                        onExpenseClick={(id, title) => {
                            setSelectedExpense({ id, title });
                            navigate('expenseDetail');
                        }}
                        // [추가] 지출 등록 화면으로 이동
                        onRegisterExpense={() => navigate('expenseRegister')}
                    />
                );

            case 'expenseDetail':
                return (
                    <ExpenseDetailScreen
                        expenseId={selectedExpense!.id}
                        userTitle={selectedExpense!.title}
                        onBack={() => { goBack(); setSelectedExpense(null); }}
                        token={authToken}
                    />
                );

            // [추가] 지출 등록 화면
            case 'expenseRegister':
                return (
                    <ExpenseRegisterScreen
                        groupId={selectedGroup!.id}
                        token={authToken}
                        onBack={goBack}
                        onComplete={() => {
                            // 등록 완료 시 뒤로가기 (GroupDetailScreen이 다시 렌더링되면서 목록 갱신됨)
                            goBack();
                        }}
                    />
                );

            case 'stats':
                return (
                    <StatisticsScreen
                        group={selectedGroup!}
                        token={authToken}
                        date={statsDate}
                        onBack={goBack}
                    />
                );

            case 'members':
                return (
                    <GroupMembersScreen
                        group={selectedGroup!}
                        onBack={goBack}
                        token={authToken}
                    />
                );

            default:
                // 알 수 없는 화면일 경우 로그인 화면으로 이동
                return <LoginScreen onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
        }
    };

    // 로딩 중 화면
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>로그인 정보를 확인 중입니다...</Text>
            </View>
        );
    }

    // 메인 앱 렌더링
    // groupDetail 화면에서만 헤더가 파란색이므로, StatusBar 색상 변경 로직은 해당 화면에서 처리하는 것이 좋습니다.
    // 여기서는 기본적으로 dark-content를 사용합니다.
    const isGroupDetailScreen = currentScreen === 'detail';

    return (
        <SafeAreaProvider style={styles.container}>
            <AlertProvider>
                <StatusBar
                    barStyle={isGroupDetailScreen ? 'light-content' : 'dark-content'}
                    backgroundColor={isGroupDetailScreen ? '#4F46E5' : '#FFF'}
                    translucent={false} // Android에서 StatusBar 색상 적용을 위해 false
                />
                {renderScreen()}
            </AlertProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4F46E5',
    },
});