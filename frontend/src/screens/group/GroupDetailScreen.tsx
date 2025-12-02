import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as groupApi from '../../services/api/groupApi';
import * as groupMemberApi from '../../services/api/groupMemberApi';
import * as expenseApi from '../../services/api/expenseApi';
import { GroupDto, GroupMemberDto } from '../../types/group.types';
import { ExpenseSimpleDTO } from '../../types/expense.types';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/dateFormatter';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { getCategoryEmoji } from '../../utils/categoryIcons';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupDetail'>;

type TabType = 'expenses' | 'members' | 'settlement';

/**
 * GroupDetailScreen - 그룹 상세 화면 (완전 개선 버전)
 *
 * 주요 개선사항:
 * 1. 실제 expense API 연동
 * 2. Pull-to-refresh 지원
 * 3. 지출 내역 클릭 시 상세 화면으로 이동
 * 4. 총 지출 금액 실시간 계산
 */
export const GroupDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, initialTab } = route.params;
  const { user } = useAuth();
  const { expenses, refreshExpenses, invalidateExpense, settlements } = useData();
  const { showToast } = useToast();

  // State
  const [group, setGroup] = useState<GroupDto | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'expenses');
  const [copied, setCopied] = useState(false);

  // 그룹 수정 모달 state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // FAB 메뉴 확장 state
  const [isFabExpanded, setIsFabExpanded] = useState(false);

  // 설정 메뉴 표시 state
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);

  // 총 지출 계산
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 현재 사용자가 OWNER인지 확인
  const currentMember = members.find((m) => m.user.id === user?.id);
  const isOwner = currentMember?.role === 'OWNER';

  /**
   * 화면 진입 시 데이터 로드
   */
  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  /**
   * 화면 포커스 시 지출 내역 새로고침
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // 화면이 포커스될 때마다 지출 내역 새로고침
      fetchExpenses();
    });

    return unsubscribe;
  }, [navigation, groupId]);

  /**
   * 그룹 정보, 멤버 목록, 지출 내역 조회
   */
  const fetchGroupData = async () => {
    try {
      setError('');
      setLoading(true);

      // 그룹 정보, 멤버 목록을 병렬로 조회
      const [groupData, membersData] = await Promise.all([
        groupApi.getGroupDetail(groupId),
        groupMemberApi.getGroupMembers(groupId),
      ]);

      setGroup(groupData);
      setMembers(membersData);

      // 지출 내역은 DataContext를 통해 관리
      await refreshExpenses(groupId);
    } catch (err: any) {
      console.error('그룹 정보 조회 에러:', err);
      setError(err.message || '그룹 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 지출 내역만 새로고침 (DataContext 사용)
   */
  const fetchExpenses = async () => {
    try {
      await refreshExpenses(groupId);
    } catch (err: any) {
      console.error('지출 내역 조회 에러:', err);
    }
  };

  /**
   * Pull-to-refresh 핸들러
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  };

  /**
   * 초대 코드 복사
   */
  const handleCopyInviteCode = async () => {
    if (!group) return;

    try {
      await Clipboard.setStringAsync(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('초대 코드 복사에 실패했습니다.', 'error');
    }
  };

  /**
   * 초대 코드 갱신
   */
  const handleRegenerateInviteCode = () => {
    if (!group) return;

    Alert.alert(
      '초대 코드 갱신',
      '초대 코드를 갱신하시겠습니까?\n\n기존 초대 코드는 더 이상 사용할 수 없게 됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '갱신',
          onPress: async () => {
            try {
              const updatedGroup = await groupApi.regenerateInviteCode(groupId);
              setGroup(updatedGroup);
              showToast('새로운 초대 코드가 생성되었습니다.', 'success');
            } catch (err: any) {
              console.error('초대 코드 갱신 에러:', err);
              showToast(err.message || '초대 코드 갱신에 실패했습니다.', 'error');
            }
          },
        },
      ]
    );
  };

  /**
   * 그룹 정보 수정 모달 열기
   */
  const handleOpenEditModal = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditModalVisible(true);
  };

  /**
   * 그룹 정보 수정 저장
   */
  const handleSaveGroupEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('입력 오류', '그룹 이름을 입력해주세요.');
      return;
    }

    try {
      setIsUpdating(true);
      const updatedGroup = await groupApi.updateGroup(groupId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setGroup(updatedGroup);
      setEditModalVisible(false);
      Alert.alert('수정 완료', '그룹 정보가 수정되었습니다.');
    } catch (err: any) {
      console.error('그룹 수정 에러:', err);
      Alert.alert('수정 실패', err.message || '그룹 정보 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 그룹 설정 메뉴 열기/닫기
   */
  const handleSettings = () => {
    setIsSettingsMenuVisible(!isSettingsMenuVisible);
  };

  /**
   * 설정 메뉴 항목 선택 핸들러
   */
  const handleSettingsMenuItemPress = (action: () => void) => {
    setIsSettingsMenuVisible(false);
    // 메뉴가 닫히는 애니메이션 후 액션 실행
    setTimeout(action, 100);
  };

  /**
   * 그룹 삭제 (OWNER 전용)
   */
  const handleDeleteGroup = () => {
    if (!group) return;

    Alert.alert(
      '그룹 삭제',
      `"${group.name}" 그룹을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 그룹의 모든 지출 내역과 정산 정보가 삭제됩니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupApi.deleteGroup(groupId);
              // 그룹 삭제 성공 시 바로 뒤로가기 (GroupList로 이동)
              navigation.goBack();
            } catch (err: any) {
              console.error('그룹 삭제 에러:', err);
              Alert.alert('삭제 실패', err.message || '그룹 삭제에 실패했습니다.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * 그룹 탈퇴 (일반 멤버)
   */
  const handleLeaveGroup = () => {
    if (!group) return;

    Alert.alert(
      '그룹 탈퇴',
      `"${group.name}" 그룹에서 탈퇴하시겠습니까?\n\n탈퇴 후에는 그룹의 지출 내역과 정산 정보를 볼 수 없습니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupMemberApi.leaveGroup(groupId);
              // 그룹 탈퇴 성공 시 바로 뒤로가기 (GroupList로 이동)
              navigation.goBack();
            } catch (err: any) {
              console.error('그룹 탈퇴 에러:', err);
              Alert.alert('탈퇴 실패', err.message || '그룹 탈퇴에 실패했습니다.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * 멤버 강퇴 (OWNER 전용)
   */
  const handleRemoveMember = (member: GroupMemberDto) => {
    if (!isOwner) return;
    if (member.role === 'OWNER') {
      Alert.alert('강퇴 불가', '방장은 강퇴할 수 없습니다.');
      return;
    }

    Alert.alert(
      '멤버 강퇴',
      `"${member.user.name}" 님을 그룹에서 강퇴하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '강퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupMemberApi.removeMember(groupId, member.user.id);
              // 멤버 목록 새로고침
              const membersData = await groupMemberApi.getGroupMembers(groupId);
              setMembers(membersData);
              Alert.alert('강퇴 완료', '멤버가 강퇴되었습니다.');
            } catch (err: any) {
              console.error('멤버 강퇴 에러:', err);
              Alert.alert('강퇴 실패', err.message || '멤버 강퇴에 실패했습니다.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * 지출 추가 화면으로 이동 (직접 입력)
   */
  const goToCreateExpense = () => {
    setIsFabExpanded(false);
    navigation.navigate(ROUTES.EXPENSES.CREATE_EXPENSE, { groupId });
  };

  /**
   * OCR 스캔 화면으로 이동
   */
  const goToOCRScan = () => {
    setIsFabExpanded(false);
    navigation.navigate(ROUTES.EXPENSES.OCR_SCAN, { groupId });
  };

  /**
   * 지출 상세 화면으로 이동
   */
  const goToExpenseDetail = (expenseId: number) => {
    navigation.navigate(ROUTES.EXPENSES.EXPENSE_DETAIL, { expenseId });
  };

  /**
   * 시간 포맷 (상대 시간)
   */
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDateTime(dateString);
  };

  /**
   * 멤버 카드 렌더링
   */
  const renderMemberItem = ({ item }: { item: GroupMemberDto }) => {
    const isMemberOwner = item.role === 'OWNER';

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onLongPress={() => handleRemoveMember(item)}
        disabled={!isOwner || isMemberOwner}
        activeOpacity={isOwner && !isMemberOwner ? 0.6 : 1}
      >
        <View style={styles.memberInfo}>
          <View style={styles.memberAvatar}>
            <Ionicons name="person" size={20} color={COLORS.text.secondary} />
          </View>
          <View>
            <View style={styles.memberNameContainer}>
              <Text style={styles.memberName}>{item.user.name}</Text>
              {isMemberOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>OWNER</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Text style={styles.memberStatus}>활동중</Text>
      </TouchableOpacity>
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="그룹 정보를 불러오는 중..." />;
  }

  /**
   * 에러 화면
   */
  if (error) {
    return (
      <ErrorMessage
        message={error}
        fullScreen
        showRetry
        onRetry={fetchGroupData}
      />
    );
  }

  /**
   * 그룹 정보가 없는 경우
   */
  if (!group) {
    return (
      <ErrorMessage message="그룹 정보를 찾을 수 없습니다." fullScreen />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* 그룹 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleSettings}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={COLORS.text.tertiary}
                />
              </TouchableOpacity>

              {/* 설정 메뉴 팝오버 */}
              {isSettingsMenuVisible && (
                <>
                  {/* 배경 오버레이 */}
                  <TouchableOpacity
                    style={styles.settingsMenuOverlay}
                    activeOpacity={1}
                    onPress={() => setIsSettingsMenuVisible(false)}
                  />

                  {/* 메뉴 카드 */}
                  <View style={styles.settingsMenu}>
                    {isOwner ? (
                      <>
                        <TouchableOpacity
                          style={styles.settingsMenuItem}
                          onPress={() => handleSettingsMenuItemPress(handleOpenEditModal)}
                        >
                          <Ionicons name="create-outline" size={20} color={COLORS.text.primary} />
                          <Text style={styles.settingsMenuItemText}>그룹 정보 수정</Text>
                        </TouchableOpacity>
                        <View style={styles.settingsMenuDivider} />
                        <TouchableOpacity
                          style={styles.settingsMenuItem}
                          onPress={() => handleSettingsMenuItemPress(handleDeleteGroup)}
                        >
                          <Ionicons name="trash-outline" size={20} color={COLORS.system.error} />
                          <Text style={[styles.settingsMenuItemText, styles.settingsMenuItemTextDanger]}>
                            그룹 삭제
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.settingsMenuItem}
                        onPress={() => handleSettingsMenuItemPress(handleLeaveGroup)}
                      >
                        <Ionicons name="exit-outline" size={20} color={COLORS.system.error} />
                        <Text style={[styles.settingsMenuItemText, styles.settingsMenuItemTextDanger]}>
                          그룹 탈퇴
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.groupInfo}>
            <View style={styles.groupIconContainer}>
              {group.icon ? (
                <Ionicons name={group.icon as any} size={32} color={COLORS.primary} />
              ) : (
                <Ionicons name="people" size={32} color={COLORS.primary} />
              )}
            </View>
            <View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                멤버 {group.memberCount}명 • {formatDate(group.createdAt)} 생성
              </Text>
            </View>
          </View>

          {/* 초대 코드 */}
          <View style={styles.inviteCodeContainer}>
            <TouchableOpacity
              style={styles.inviteCodeCard}
              onPress={handleCopyInviteCode}
              activeOpacity={0.8}
            >
              <View style={styles.inviteCodeLeft}>
                <Text style={styles.inviteCodeLabel}>초대 코드</Text>
                <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              </View>
              <View style={styles.inviteCodeRight}>
                <Text style={[styles.copyText, copied && styles.copiedText]}>
                  {copied ? '복사됨!' : '복사'}
                </Text>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color={copied ? COLORS.primary : COLORS.text.tertiary}
                />
              </View>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={styles.refreshCodeButton}
                onPress={handleRegenerateInviteCode}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={COLORS.text.tertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 탭 네비게이션 */}
        <View style={styles.tabContainer}>
          {(['expenses', 'members', 'settlement'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab === 'expenses' && '지출 내역'}
                {tab === 'members' && '멤버'}
                {tab === 'settlement' && '정산 현황'}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* 탭 컨텐츠 */}
        <View style={styles.tabContent}>
          {activeTab === 'expenses' && (
            <View style={styles.expensesTab}>
              {/* 총 지출 카드 */}
              <View style={styles.totalExpenseCard}>
                <Text style={styles.totalExpenseLabel}>현재까지 총 지출</Text>
                <View style={styles.totalExpenseAmountContainer}>
                  <Text style={styles.totalExpenseAmount}>
                    {totalExpense.toLocaleString()}
                  </Text>
                  <Text style={styles.totalExpenseUnit}>원</Text>
                </View>
                <View style={styles.totalExpenseDivider} />
                <View style={styles.totalExpenseDetail}>
                  <Text style={styles.totalExpenseDetailLabel}>총 지출 건수</Text>
                  <Text style={styles.totalExpenseDetailAmount}>
                    {expenses.length}건
                  </Text>
                </View>
              </View>

              {/* 최근 활동 */}
              {expenses.length > 0 ? (
                <>
                  <Text style={styles.sectionLabel}>최근 활동</Text>
                  {expenses.map((expense) => (
                    <Card key={expense.id} style={styles.expenseCard}>
                      <TouchableOpacity
                        style={styles.expenseItem}
                        onPress={() => goToExpenseDetail(expense.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.expenseIconContainer}>
                          <Text style={styles.expenseIcon}>
                            {getCategoryEmoji(expense.title)}
                          </Text>
                        </View>
                        <View style={styles.expenseContent}>
                          <Text style={styles.expenseTitle} numberOfLines={1} ellipsizeMode="tail">
                            {expense.title}
                          </Text>
                          <Text style={styles.expenseUser}>
                            {expense.payerName} 결제 •{' '}
                            {formatRelativeTime(expense.expenseData)}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          {expense.amount.toLocaleString()}원
                        </Text>
                      </TouchableOpacity>
                    </Card>
                  ))}
                </>
              ) : (
                <View style={styles.emptyExpenses}>
                  <Ionicons
                    name="receipt-outline"
                    size={48}
                    color={COLORS.text.tertiary}
                  />
                  <Text style={styles.emptyTitle}>아직 지출 내역이 없습니다</Text>
                  <Text style={styles.emptySubtitle}>
                    우측 하단의 + 버튼을 눌러{'\n'}
                    첫 지출을 등록해보세요!
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'members' && (
            <View style={styles.membersTab}>
              {members.map((member) => (
                <Card key={member.id} style={styles.memberCard}>
                  {renderMemberItem({ item: member })}
                </Card>
              ))}
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={handleCopyInviteCode}
              >
                <Ionicons name="add" size={16} color={COLORS.text.tertiary} />
                <Text style={styles.addMemberText}>멤버 초대하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'settlement' && (
            <View style={styles.settlementTab}>
              {/* 투표 진행 중 */}
              {expenses.filter(e => e.voteId && !e.isVoteClosed).length > 0 && (
                <>
                  <Text style={styles.settlementSectionTitle}>투표 진행 중</Text>
                  {expenses
                    .filter(e => e.voteId && !e.isVoteClosed)
                    .map((expense) => (
                      <Card key={expense.id} style={styles.settlementCard}>
                        <TouchableOpacity
                          style={styles.settlementItem}
                          onPress={() => {
                            // 투표 진행 중인 경우 Vote 화면으로 이동 (투표/수정 가능)
                            navigation.navigate('Vote', {
                              expenseId: expense.id,
                              isEdit: false
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.settlementIconContainer}>
                            <Ionicons
                              name="hand-left"
                              size={20}
                              color={COLORS.primary}
                            />
                          </View>
                          <View style={styles.settlementContent}>
                            <Text style={styles.settlementTitle} numberOfLines={1}>
                              {expense.title}
                            </Text>
                            <Text style={styles.settlementUser}>
                              {expense.payerName} • {formatDate(expense.expenseData)}
                            </Text>
                          </View>
                          <View style={styles.settlementRight}>
                            <Text style={styles.settlementAmount}>
                              {expense.amount.toLocaleString()}원
                            </Text>
                            <View style={[styles.settlementBadge, { backgroundColor: COLORS.primary }]}>
                              <Text style={styles.settlementBadgeText}>투표 중</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Card>
                    ))}
                </>
              )}

              {/* 완료된 정산 */}
              {expenses.filter(e => {
                const settlement = settlements.get(e.id);
                return settlement && settlement.status === 'COMPLETED';
              }).length > 0 && (
                <>
                  <Text style={[styles.settlementSectionTitle, expenses.filter(e => e.voteId && !e.isVoteClosed).length > 0 && { marginTop: 24 }]}>완료</Text>
                  {expenses
                    .filter(e => {
                      const settlement = settlements.get(e.id);
                      return settlement && settlement.status === 'COMPLETED';
                    })
                    .map((expense) => (
                      <Card key={expense.id} style={styles.settlementCard}>
                        <TouchableOpacity
                          style={styles.settlementItem}
                          onPress={() => {
                            if (expense.settlementId) {
                              navigation.navigate('SettlementDetail', {
                                settlementId: expense.settlementId
                              });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.settlementIconContainer}>
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={COLORS.system.success}
                            />
                          </View>
                          <View style={styles.settlementContent}>
                            <Text style={styles.settlementTitle} numberOfLines={1}>
                              {expense.title}
                            </Text>
                            <Text style={styles.settlementUser}>
                              {expense.payerName} • {formatDate(expense.expenseData)}
                            </Text>
                          </View>
                          <View style={styles.settlementRight}>
                            <Text style={styles.settlementAmount}>
                              {expense.amount.toLocaleString()}원
                            </Text>
                            <View style={styles.settlementBadge}>
                              <Text style={styles.settlementBadgeText}>완료</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Card>
                    ))}
                </>
              )}

              {/* 정산 중 */}
              {expenses.filter(e => {
                const settlement = settlements.get(e.id);
                return settlement && settlement.status === 'PENDING';
              }).length > 0 && (
                <>
                  <Text style={[styles.settlementSectionTitle, { marginTop: 24 }]}>
                    정산 중
                  </Text>
                  {expenses
                    .filter(e => {
                      const settlement = settlements.get(e.id);
                      return settlement && settlement.status === 'PENDING';
                    })
                    .map((expense) => (
                      <Card key={expense.id} style={styles.settlementCard}>
                        <TouchableOpacity
                          style={styles.settlementItem}
                          onPress={() => {
                            if (expense.settlementId) {
                              navigation.navigate('SettlementDetail', {
                                settlementId: expense.settlementId
                              });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.settlementIconContainer}>
                            <Ionicons
                              name="sync"
                              size={20}
                              color={COLORS.system.warning}
                            />
                          </View>
                          <View style={styles.settlementContent}>
                            <Text style={styles.settlementTitle} numberOfLines={1}>
                              {expense.title}
                            </Text>
                            <Text style={styles.settlementUser}>
                              {expense.payerName} • {formatDate(expense.expenseData)}
                            </Text>
                          </View>
                          <View style={styles.settlementRight}>
                            <Text style={styles.settlementAmount}>
                              {expense.amount.toLocaleString()}원
                            </Text>
                            <View style={[styles.settlementBadge, { backgroundColor: COLORS.system.warning }]}>
                              <Text style={styles.settlementBadgeText}>정산 중</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Card>
                    ))}
                </>
              )}

              {/* 미정산 지출 (투표가 생성되지 않은 경우만) */}
              {expenses.filter(e => !e.voteId && !e.settlementId).length > 0 && (
                <>
                  <Text style={[styles.settlementSectionTitle, { marginTop: 24 }]}>
                    미정산
                  </Text>
                  {expenses
                    .filter(e => !e.voteId && !e.settlementId)
                    .map((expense) => {
                      const isMyExpense = user && expense.payerName === user.name;
                      return (
                        <Card key={expense.id} style={styles.settlementCard}>
                          <TouchableOpacity
                            style={styles.settlementItem}
                            onPress={() => {
                              if (isMyExpense) {
                                navigation.navigate('CreateSettlement', {
                                  expenseId: expense.id
                                });
                              } else {
                                Alert.alert(
                                  '정산 권한 없음',
                                  '본인이 지출한 내역만 정산할 수 있습니다.'
                                );
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.settlementIconContainer}>
                              <Ionicons
                                name="time-outline"
                                size={20}
                                color={isMyExpense ? COLORS.primary : COLORS.text.tertiary}
                              />
                            </View>
                            <View style={styles.settlementContent}>
                              <Text style={styles.settlementTitle} numberOfLines={1}>
                                {expense.title}
                              </Text>
                              <Text style={styles.settlementUser}>
                                {expense.payerName} • {formatDate(expense.expenseData)}
                              </Text>
                            </View>
                            <View style={styles.settlementRight}>
                              <Text style={styles.settlementAmount}>
                                {expense.amount.toLocaleString()}원
                              </Text>
                              {isMyExpense && (
                                <View style={[styles.settlementBadge, styles.settlementBadgePending]}>
                                  <Text style={styles.settlementBadgeTextPending}>정산하기</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        </Card>
                      );
                    })}
                </>
              )}

              {/* 지출이 없는 경우 */}
              {expenses.length === 0 && (
                <View style={styles.emptySettlement}>
                  <Ionicons
                    name="receipt-outline"
                    size={48}
                    color={COLORS.text.tertiary}
                  />
                  <Text style={styles.emptyTitle}>지출 내역이 없습니다</Text>
                  <Text style={styles.emptySubtitle}>
                    먼저 지출을 등록한 후{'\n'}
                    정산을 시작해보세요
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB 버튼 (지출 추가) */}
      {activeTab === 'expenses' && (
        <>
          {/* 배경 오버레이 */}
          {isFabExpanded && (
            <TouchableOpacity
              style={styles.fabOverlay}
              activeOpacity={1}
              onPress={() => setIsFabExpanded(false)}
            />
          )}

          {/* 확장 메뉴 */}
          {isFabExpanded && (
            <View style={styles.fabMenuContainer}>
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={goToOCRScan}
                activeOpacity={0.9}
              >
                <Text style={styles.fabMenuText}>영수증 스캔</Text>
                <View style={[styles.fabMenuButton, styles.fabMenuButtonOCR]}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={goToCreateExpense}
                activeOpacity={0.9}
              >
                <Text style={styles.fabMenuText}>직접 입력</Text>
                <View style={[styles.fabMenuButton, styles.fabMenuButtonManual]}>
                  <Ionicons name="create" size={24} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 메인 FAB 버튼 */}
          <TouchableOpacity
            style={[styles.fab, isFabExpanded && styles.fabExpanded]}
            onPress={() => setIsFabExpanded(!isFabExpanded)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFabExpanded ? 'close' : 'add'}
              size={28}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </>
      )}

      {/* 그룹 정보 수정 모달 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>그룹 정보 수정</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>그룹 이름 *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="그룹 이름을 입력하세요"
                    placeholderTextColor={COLORS.text.tertiary}
                    maxLength={50}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>설명 (선택)</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="그룹 설명을 입력하세요"
                    placeholderTextColor={COLORS.text.tertiary}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveGroupEdit}
                disabled={isUpdating}
              >
                <Text style={styles.modalButtonTextSave}>
                  {isUpdating ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  settingsButton: {
    padding: 8,
    marginRight: -8,
  },
  // 설정 메뉴 팝오버 스타일
  settingsMenuOverlay: {
    position: 'absolute',
    top: -16,
    right: -24,
    bottom: -960, // 충분히 큰 값으로 전체 화면 커버
    left: -400,
    zIndex: 999,
  },
  settingsMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    minWidth: 180,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  settingsMenuItemTextDanger: {
    color: COLORS.system.error,
  },
  settingsMenuDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginHorizontal: 8,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  groupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteCodeCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  refreshCodeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 8,
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: 'monospace',
  },
  inviteCodeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginRight: 4,
  },
  copiedText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
    marginTop: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.tertiary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  tabContent: {
    padding: 16,
  },
  expensesTab: {
    paddingBottom: 20,
  },
  totalExpenseCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  totalExpenseLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  totalExpenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalExpenseAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  totalExpenseUnit: {
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 4,
  },
  totalExpenseDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 16,
  },
  totalExpenseDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalExpenseDetailLabel: {
    fontSize: 14,
    color: COLORS.white,
  },
  totalExpenseDetailAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  expenseCard: {
    marginBottom: 12,
    padding: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIcon: {
    fontSize: 18,
  },
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  expenseUser: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  membersTab: {},
  memberCard: {
    marginBottom: 12,
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: 8,
  },
  ownerBadge: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberStatus: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 16,
  },
  addMemberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    marginLeft: 8,
  },
  settlementTab: {
    paddingBottom: 20,
  },
  settlementSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  settlementCard: {
    marginBottom: 12,
    padding: 16,
  },
  settlementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settlementContent: {
    flex: 1,
  },
  settlementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  settlementUser: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  settlementRight: {
    alignItems: 'flex-end',
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  settlementBadge: {
    backgroundColor: COLORS.system.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settlementBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  settlementBadgePending: {
    backgroundColor: COLORS.primary,
  },
  settlementBadgeTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptySettlement: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabExpanded: {
    backgroundColor: COLORS.text.primary,
    transform: [{ rotate: '45deg' }],
  },
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 92,
    right: 24,
    zIndex: 2,
    gap: 16,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabMenuText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabMenuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabMenuButtonOCR: {
    backgroundColor: '#3B82F6', // blue-500
  },
  fabMenuButtonManual: {
    backgroundColor: COLORS.primary,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  textAreaWrapper: {
    minHeight: 100,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  modalButtonSave: {
    backgroundColor: COLORS.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
