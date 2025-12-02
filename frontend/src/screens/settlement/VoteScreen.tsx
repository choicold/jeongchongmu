import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { VoteOptionCard } from '../../components/vote/VoteOptionCard';
import * as voteApi from '../../services/api/voteApi';
import * as groupMemberApi from '../../services/api/groupMemberApi';
import * as expenseApi from '../../services/api/expenseApi';
import { VoteResponse, VoteOptionDto } from '../../types/vote.types';
import { GroupMemberDto } from '../../types/group.types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = NativeStackScreenProps<GroupsStackParamList, 'Vote'>;

/**
 * VoteScreen - 항목별 정산 투표 화면
 *
 * 멤버들이 각자 먹은 메뉴를 선택(투표)합니다.
 * 다중 선택이 가능하며, 이미 투표한 사람들의 이름이 표시됩니다.
 */
export const VoteScreen: React.FC<Props> = ({ navigation, route }) => {
  const { expenseId, isEdit } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showAlert } = useCustomAlert();

  // State
  const [voteData, setVoteData] = useState<VoteResponse | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [originalVotedOptions, setOriginalVotedOptions] = useState<number[]>([]); // 초기 투표 상태 저장
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expenseData, setExpenseData] = useState<any>(null);

  /**
   * 화면 진입 시 데이터 로드
   */
  useEffect(() => {
    fetchData();
  }, [expenseId]);

  /**
   * 투표 현황이 로드되면 현재 사용자가 투표한 항목들을 selectedOptions에 반영
   */
  useEffect(() => {
    if (voteData && user?.id && members.length > 0) {
      const myVotedOptionIds: number[] = [];

      voteData.options.forEach((option) => {
        if (option.votedUserIds.includes(user.id)) {
          myVotedOptionIds.push(option.optionId);
        }
      });

      setSelectedOptions(myVotedOptionIds);
      setOriginalVotedOptions(myVotedOptionIds); // 초기 투표 상태 저장
    }
  }, [voteData, user, members]);

  /**
   * 투표 현황 및 그룹 멤버 조회
   */
  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      // 1. 지출 정보를 먼저 조회
      const expenseDetail = await expenseApi.getExpenseDetail(expenseId);
      setExpenseData(expenseDetail);

      // 2. 현재 사용자가 지출 참여자인지 확인 (접근 권한)
      if (user && expenseDetail.participants && expenseDetail.participants.length > 0) {
        const isParticipant = expenseDetail.participants.includes(user.name);
        if (!isParticipant) {
          setError('이 지출의 참여자만 투표할 수 있습니다.');
          return;
        }
      }

      // 3. 투표 현황 조회
      const voteResponse = await voteApi.getVoteStatus(expenseId);
      setVoteData(voteResponse);

      // 4. 그룹 멤버 조회 (expenseDetail의 groupId 필요)
      const membersData = await groupMemberApi.getGroupMembers(
        expenseDetail.groupId
      );
      setMembers(membersData);
    } catch (err: any) {
      console.error('데이터 조회 에러:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * userId를 이름으로 변환
   */
  const getUserName = (userId: number): string => {
    const member = members.find((m) => m.user.id === userId);
    return member ? member.user.name : `사용자${userId}`;
  };

  /**
   * 현재 사용자가 그룹 OWNER인지 확인
   */
  const isOwner = (): boolean => {
    if (!user) return false;
    const currentMember = members.find((m) => m.user.id === user.id);
    return currentMember?.role === 'OWNER';
  };

  /**
   * 옵션 선택/해제 토글
   */
  const toggleOption = (optionId: number) => {
    if (selectedOptions.includes(optionId)) {
      // 이미 선택된 경우 → 해제
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
    } else {
      // 선택되지 않은 경우 → 추가
      setSelectedOptions([...selectedOptions, optionId]);
    }
  };

  /**
   * 투표하기
   */
  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      showToast('최소 1개 이상의 항목을 선택해주세요.', 'warning');
      return;
    }

    if (!user?.id) {
      showToast('사용자 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    const userId = user.id;

    try {
      setSubmitting(true);

      // castVote는 토글 API이므로 차이점만 전송해야 함
      // 추가된 항목: 현재 선택했지만 원래 투표하지 않았던 항목
      const addedOptions = selectedOptions.filter(
        (id) => !originalVotedOptions.includes(id)
      );
      // 제거된 항목: 원래 투표했지만 현재 선택하지 않은 항목
      const removedOptions = originalVotedOptions.filter(
        (id) => !selectedOptions.includes(id)
      );

      // 변경된 항목들에 대해서만 castVote 호출 (토글)
      const changedOptions = [...addedOptions, ...removedOptions];

      for (const optionId of changedOptions) {
        await voteApi.castVote({ userId, optionId });
      }

      showToast('투표가 성공적으로 등록되었습니다.', 'success');

      // 수정 모드면 뒤로가기 (VoteDetail로 돌아감), 아니면 VoteDetail로 replace
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.replace('VoteDetail', { expenseId });
      }
    } catch (err: any) {
      console.error('투표 에러:', err);
      showToast(
        err.message || '투표에 실패했습니다. 다시 시도해주세요.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 투표 마감 (OWNER만)
   */
  const handleCloseVote = () => {
    showAlert({
      title: '투표 마감',
      message: '투표를 마감하고 정산을 진행하시겠습니까?',
      buttons: [
        { text: '취소', style: 'cancel' },
        {
          text: '마감',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);

              // 투표 마감 및 정산 생성
              const settlementId = await voteApi.closeVote(expenseId);

              showToast('정산이 생성되었습니다.', 'success');

              // 정산 상세 화면으로 이동
              navigation.replace(ROUTES.SETTLEMENTS.SETTLEMENT_DETAIL, {
                settlementId,
              });
            } catch (err: any) {
              console.error('투표 마감 에러:', err);
              showToast(
                err.message || '투표 마감에 실패했습니다.',
                'error'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    });
  };

  /**
   * VoteOptionCard 렌더링
   */
  const renderOptionItem = ({ item }: { item: VoteOptionDto }) => {
    const votedUserNames = item.votedUserIds.map(getUserName);

    return (
      <VoteOptionCard
        option={item}
        isSelected={selectedOptions.includes(item.optionId)}
        onToggle={() => toggleOption(item.optionId)}
        votedUserNames={votedUserNames}
      />
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="투표 현황을 불러오는 중..." />;
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
        onRetry={fetchData}
      />
    );
  }

  /**
   * 투표 데이터가 없는 경우
   */
  if (!voteData) {
    return (
      <ErrorMessage message="투표 정보를 찾을 수 없습니다." fullScreen />
    );
  }

  /**
   * 투표 항목이 없는 경우 (지출 등록 시 항목을 추가하지 않은 경우)
   */
  if (voteData.options.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={async () => {
              try {
                const expenseData = await expenseApi.getExpenseDetail(expenseId);
                navigation.navigate('GroupDetail', {
                  groupId: expenseData.groupId,
                  initialTab: 'settlement',
                });
              } catch (err) {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerContainerTitle}>항목별 투표</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="basket-outline"
            size={64}
            color={COLORS.text.tertiary}
          />
          <Text style={styles.emptyStateTitle}>투표할 항목이 없습니다</Text>
          <Text style={styles.emptyStateSubtitle}>
            지출 등록 시 항목을 추가하지 않아{'\n'}
            투표를 진행할 수 없습니다.
          </Text>
          {isOwner() && (
            <Button
              title="지출 수정하기"
              onPress={async () => {
                try {
                  const expenseData = await expenseApi.getExpenseDetail(expenseId);
                  navigation.navigate('GroupDetail', {
                    groupId: expenseData.groupId,
                    initialTab: 'settlement',
                  });
                } catch (err) {
                  navigation.goBack();
                }
              }}
              variant="secondary"
              style={styles.emptyStateButton}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={async () => {
            // 그룹 상세 화면의 정산 탭으로 이동
            try {
              const expenseData = await expenseApi.getExpenseDetail(expenseId);
              navigation.navigate('GroupDetail', {
                groupId: expenseData.groupId,
                initialTab: 'settlement',
              });
            } catch (err) {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerContainerTitle}>항목별 투표</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 서브 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            내가 사용한 항목을 선택해주세요 (다중 선택 가능)
          </Text>
        </View>

        {/* 투표 상태 */}
        <Card style={styles.section}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>투표 상태</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: voteData.isClosed
                    ? COLORS.text.tertiary
                    : COLORS.system.success,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {voteData.isClosed ? '마감됨' : '진행 중'}
              </Text>
            </View>
          </View>
        </Card>

        {/* 투표가 마감된 경우 */}
        {voteData.isClosed && (
          <View style={styles.closedContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={48}
              color={COLORS.text.tertiary}
            />
            <Text style={styles.closedTitle}>투표가 마감되었습니다</Text>
            <Text style={styles.closedSubtitle}>
              정산 결과를 확인해주세요
            </Text>
          </View>
        )}

        {/* 투표 옵션 리스트 */}
        {!voteData.isClosed && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                항목 선택 ({voteData.options.length}개)
              </Text>
              <FlatList
                data={voteData.options}
                keyExtractor={(item) => item.optionId.toString()}
                renderItem={renderOptionItem}
                scrollEnabled={false}
              />
            </View>

            {/* 선택된 항목 수 */}
            {selectedOptions.length > 0 && (
              <View style={styles.selectedContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.selectedText}>
                  {selectedOptions.length}개 항목 선택됨
                </Text>
              </View>
            )}

            {/* 투표하기 버튼 */}
            <Button
              title={selectedOptions.length > 0 ? "투표 저장" : "투표하기"}
              onPress={handleVote}
              variant="primary"
              loading={submitting}
              disabled={submitting || selectedOptions.length === 0}
              style={styles.voteButton}
            />

            {/* OWNER 전용 버튼들 */}
            {isOwner() && (
              <Button
                title="투표 마감하기"
                onPress={handleCloseVote}
                variant="danger"
                style={styles.closeButton}
              />
            )}
          </>
        )}

        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            여러 항목을 선택할 수 있습니다.{'\n'}
            함께 사용한 항목은 모두 선택해주세요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerContainerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  closedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginBottom: 24,
  },
  closedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  closedSubtitle: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: COLORS.background.default,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  voteButton: {
    marginBottom: 12,
  },
  closeButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: COLORS.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});
