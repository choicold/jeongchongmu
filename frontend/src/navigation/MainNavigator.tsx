import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../context/NotificationContext';

// Groups Tab
import { GroupListScreen } from '../screens/group/GroupListScreen';
import { GroupDetailScreen } from '../screens/group/GroupDetailScreen';
import { CreateGroupScreen } from '../screens/group/CreateGroupScreen';
import { JoinGroupScreen } from '../screens/group/JoinGroupScreen';
import { ExpenseListScreen } from '../screens/expense/ExpenseListScreen';
import { ExpenseDetailScreen } from '../screens/expense/ExpenseDetailScreen';
import { CreateExpenseScreen } from '../screens/expense/CreateExpenseScreen';
import { EditExpenseScreen } from '../screens/expense/EditExpenseScreen';
import { OCRScanScreen } from '../screens/expense/OCRScanScreen';
import { CreateSettlementScreen } from '../screens/settlement/CreateSettlementScreen';
import { SettlementDetailScreen } from '../screens/settlement/SettlementDetailScreen';
import { VoteScreen } from '../screens/settlement/VoteScreen';
import { VoteDetailScreen } from '../screens/settlement/VoteDetailScreen';

// Statistics Tab
import { StatisticsScreen } from '../screens/statistics/StatisticsScreen';

// Notifications Tab
import { NotificationListScreen } from '../screens/notification/NotificationListScreen';

// Profile Tab
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';

// Main (Home) Tab
import { MainScreen } from '../screens/home/MainScreen';

/**
 * 탭별 ParamList 타입 정의
 */
export type MainStackParamList = {
  Main: undefined;
  ExpenseDetail: { expenseId: number };
  GroupDetail: { groupId: number };
  CreateSettlement: { expenseId: number };
  SettlementDetail: { settlementId: number };
  CreateExpense: { groupId: number; ocrResult?: any };
  EditExpense: { expenseId: number };
  Vote: { expenseId: number };
  VoteDetail: { expenseId: number };
};

export type GroupsStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: number; initialTab?: 'expenses' | 'members' | 'settlement' };
  CreateGroup: undefined;
  JoinGroup: undefined;
  ExpenseList: { groupId: number };
  ExpenseDetail: { expenseId: number };
  CreateExpense: { groupId: number; ocrResult?: any };
  EditExpense: { expenseId: number };
  OCRScan: { groupId: number };
  CreateSettlement: { expenseId: number };
  SettlementDetail: { settlementId: number };
  Vote: { expenseId: number; isEdit?: boolean };
  VoteDetail: { expenseId: number };
};

export type StatisticsStackParamList = {
  Statistics: { groupId?: number };
  SettlementDetail: { settlementId: number };
};

export type NotificationsStackParamList = {
  NotificationList: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  ProfileEdit: undefined;
};

export type MainTabParamList = {
  MainTab: undefined;
  GroupsTab: undefined;
  StatisticsTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

// 각 탭별 스택 네비게이터
const MainStack = createNativeStackNavigator<MainStackParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();
const StatisticsStack = createNativeStackNavigator<StatisticsStackParamList>();
const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * 메인(홈) 탭 스택 네비게이터
 */
const MainNavigatorStack: React.FC = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Main"
        component={MainScreen}
        options={{ title: '홈', headerShown: false }}
      />
      <MainStack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: '지출 상세', headerShown: false }}
      />
      <MainStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: '그룹 상세', headerShown: false }}
      />
      <MainStack.Screen
        name="CreateSettlement"
        component={CreateSettlementScreen}
        options={{ title: '정산 생성', headerShown: false }}
      />
      <MainStack.Screen
        name="SettlementDetail"
        component={SettlementDetailScreen}
        options={{ title: '정산 결과', headerShown: false }}
      />
      <MainStack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: '지출 등록', headerShown: false }}
      />
      <MainStack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{ title: '지출 수정', headerShown: false }}
      />
      <MainStack.Screen
        name="Vote"
        component={VoteScreen}
        options={{ title: '항목별 투표', headerShown: false }}
      />
      <MainStack.Screen
        name="VoteDetail"
        component={VoteDetailScreen}
        options={{ title: '투표 조회', headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

/**
 * 그룹 탭 스택 네비게이터
 */
const GroupsNavigator: React.FC = () => {
  return (
    <GroupsStack.Navigator>
      <GroupsStack.Screen
        name="GroupList"
        component={GroupListScreen}
        options={{
          title: '내 그룹',
        }}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: '그룹 상세', headerShown: false }}
      />
      <GroupsStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: '그룹 생성', headerShown: false }}
      />
      <GroupsStack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ title: '그룹 참여', headerShown: false }}
      />
      <GroupsStack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={{ title: '지출 내역', headerShown: false }}
      />
      <GroupsStack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: '지출 상세', headerShown: false }}
      />
      <GroupsStack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: '지출 등록', headerShown: false }}
      />
      <GroupsStack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{ title: '지출 수정', headerShown: false }}
      />
      <GroupsStack.Screen
        name="OCRScan"
        component={OCRScanScreen}
        options={{ title: '영수증 스캔', headerShown: false }}
      />
      <GroupsStack.Screen
        name="CreateSettlement"
        component={CreateSettlementScreen}
        options={{ title: '정산 생성', headerShown: false }}
      />
      <GroupsStack.Screen
        name="SettlementDetail"
        component={SettlementDetailScreen}
        options={{ title: '정산 결과', headerShown: false }}
      />
      <GroupsStack.Screen
        name="Vote"
        component={VoteScreen}
        options={{ title: '항목별 투표', headerShown: false }}
      />
      <GroupsStack.Screen
        name="VoteDetail"
        component={VoteDetailScreen}
        options={{ title: '투표 조회', headerShown: false }}
      />
    </GroupsStack.Navigator>
  );
};

/**
 * 통계 탭 스택 네비게이터
 */
const StatisticsNavigator: React.FC = () => {
  return (
    <StatisticsStack.Navigator>
      <StatisticsStack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: '통계', headerShown: false }}
      />
      <StatisticsStack.Screen
        name="SettlementDetail"
        component={SettlementDetailScreen}
        options={{ title: '정산 결과', headerShown: false }}
      />
    </StatisticsStack.Navigator>
  );
};

/**
 * 알림 탭 스택 네비게이터
 */
const NotificationsNavigator: React.FC = () => {
  return (
    <NotificationsStack.Navigator>
      <NotificationsStack.Screen
        name="NotificationList"
        component={NotificationListScreen}
        options={{ title: '알림' }}
      />
    </NotificationsStack.Navigator>
  );
};

/**
 * 프로필 탭 스택 네비게이터
 */
const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: '프로필' }}
      />
      <ProfileStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: '프로필 수정', headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * MainNavigator - 메인 앱의 탭 네비게이터
 * 로그인한 사용자에게 표시됩니다.
 *
 * @example
 * ```tsx
 * // 화면에서 네비게이션 사용
 * import { CompositeScreenProps } from '@react-navigation/native';
 * import { NativeStackScreenProps } from '@react-navigation/native-stack';
 * import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
 * import { GroupsStackParamList, MainTabParamList } from '../navigation/MainNavigator';
 *
 * type Props = CompositeScreenProps<
 *   NativeStackScreenProps<GroupsStackParamList, 'GroupList'>,
 *   BottomTabScreenProps<MainTabParamList>
 * >;
 *
 * function GroupListScreen({ navigation }: Props) {
 *   const goToDetail = (id: number) =>
 *     navigation.navigate('GroupDetail', { groupId: id });
 *   // ...
 * }
 * ```
 */
export const MainNavigator: React.FC = () => {
  const { unreadCount } = useNotification();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // 각 스택에서 헤더 표시
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'MainTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GroupsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'StatisticsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981', // Emerald 500 (COLORS.primary)
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="MainTab"
        component={MainNavigatorStack}
        options={{
          title: '홈',
          tabBarLabel: '홈',
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsNavigator}
        options={{
          title: '그룹',
          tabBarLabel: '그룹',
        }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsNavigator}
        options={{
          title: '통계',
          tabBarLabel: '통계',
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsNavigator}
        options={{
          title: '알림',
          tabBarLabel: '알림',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: '프로필',
          tabBarLabel: '프로필',
        }}
      />
    </Tab.Navigator>
  );
};
