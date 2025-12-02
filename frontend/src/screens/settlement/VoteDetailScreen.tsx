import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
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
import { COLORS } from '../../constants/colors';

type Props = NativeStackScreenProps<GroupsStackParamList, 'VoteDetail'>;

/**
 * VoteDetailScreen - 투표 조회 화면
 *
 * 투표 결과를 조회하는 readonly 화면입니다.
 * - 선택한 항목들을 볼 수 있지만 수정할 수 없습니다
 * - 헤더에 수정 아이콘이 있어 편집 모드로 전환할 수 있습니다
 * - 생성자의 경우 삭제 아이콘도 표시됩니다
 */
export const VoteDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { expenseId } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [voteData, setVoteData] = useState<VoteResponse | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
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
   * 화면 포커스 시 데이터 새로고침
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation, expenseId]);

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
    }
  }, [voteData, user, members]);

  /**
   * 투표 현황 및 그룹 멤버 조회
   */
  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      // 투표 현황과 지출 정보를 병렬로 조회
      const [voteResponse, expenseDetail] = await Promise.all([
        voteApi.getVoteStatus(expenseId),
        expenseApi.getExpenseDetail(expenseId),
      ]);

      setVoteData(voteResponse);
      setExpenseData(expenseDetail);

      // 그룹 멤버 조회 (expenseDetail의 groupId 필요)
      const membersData = await groupMemberApi.getGroupMembers(
        expenseDetail.groupId
      );
      setMembers(membersData);

      // 현재 사용자가 정산 참여자인지 확인
      if (user && expenseDetail.participants && expenseDetail.participants.length > 0) {
        const isParticipant = expenseDetail.participants.includes(user.name);
        if (!isParticipant) {
          setError('이 정산의 참여자만 투표 내용을 볼 수 있습니다.');
        }
      }
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
   * 현재 사용자가 투표를 삭제할 권한이 있는지 확인
   * 권한: 그룹 OWNER 또는 지출 등록자
   */
  const canDeleteVote = (): boolean => {
    if (!user || !voteData) return false;
    return isOwner() || voteData.payerId === user.id;
  };

  /**
   * 수정 버튼 클릭 시 투표 화면으로 이동
   */
  const handleEdit = () => {
    navigation.navigate('Vote', { expenseId, isEdit: true });
  };

  /**
   * 투표 삭제 (OWNER만)
   */
  const handleDelete = () => {
    Alert.alert(
      '투표 삭제',
      '투표를 삭제하시겠습니까?\n\n모든 투표 데이터가 삭제되며 투표를 다시 생성할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);

              // 투표 삭제
              await voteApi.deleteVote(expenseId);

              // 지출 정보를 가져와서 groupId 획득
              const expenseData = await expenseApi.getExpenseDetail(expenseId);

              showToast('투표가 삭제되었습니다.', 'success');

              // 그룹 상세 화면의 정산 탭으로 이동
              navigation.navigate('GroupDetail', {
                groupId: expenseData.groupId,
                initialTab: 'settlement',
              });
            } catch (err: any) {
              console.error('투표 삭제 에러:', err);
              showToast(
                err.message || '투표 삭제에 실패했습니다.',
                'error'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * VoteOptionCard 렌더링 (readonly)
   */
  const renderOptionItem = ({ item }: { item: VoteOptionDto }) => {
    const votedUserNames = item.votedUserIds.map(getUserName);

    return (
      <VoteOptionCard
        option={item}
        isSelected={selectedOptions.includes(item.optionId)}
        onToggle={() => {}} // 빈 함수로 선택 불가능하게
        votedUserNames={votedUserNames}
        disabled={true}
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
   * 투표 항목이 없는 경우
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
          <View style={styles.headerActions} />
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
        <View style={styles.headerActions}>
          {/* 수정 아이콘 (투표가 진행 중일 때만) */}
          {!voteData?.isClosed && (
            <TouchableOpacity
              onPress={handleEdit}
              style={styles.headerIconButton}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          )}
          {/* 삭제 아이콘 (OWNER 또는 지출 등록자, 투표가 진행 중일 때만) */}
          {canDeleteVote() && !voteData?.isClosed && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.headerIconButton}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.system.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 서브 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            내가 선택한 항목을 확인할 수 있습니다
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

        {/* 투표 옵션 리스트 */}
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

        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            {voteData.isClosed
              ? '투표가 마감되어 수정할 수 없습니다.'
              : '투표를 수정하려면 상단의 수정 아이콘을 눌러주세요.'}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    padding: 8,
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
  },
});
