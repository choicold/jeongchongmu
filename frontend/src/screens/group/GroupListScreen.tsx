import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList, MainTabParamList } from '../../navigation/MainNavigator';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as groupApi from '../../services/api/groupApi';
import { GroupDto } from '../../types/group.types';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = CompositeScreenProps<
  NativeStackScreenProps<GroupsStackParamList, 'GroupList'>,
  BottomTabScreenProps<MainTabParamList>
>;

/**
 * GroupListScreen - 내 그룹 목록 화면
 *
 * 사용자가 속한 그룹 목록을 표시합니다.
 * Pull-to-refresh를 지원하며, 각 그룹을 클릭하면 상세 화면으로 이동합니다.
 */
export const GroupListScreen: React.FC<Props> = ({ navigation }) => {
  // State
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  /**
   * 헤더 버튼 설정
   */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            // 그룹 전체보기에서 뒤로가기를 누르면 메인 탭으로 이동
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('MainTab');
            }
          }}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={goToCreateGroup}
          style={styles.headerButton}
        >
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  /**
   * 화면 진입 시 그룹 목록 로드
   */
  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * 화면 포커스 시 그룹 목록 새로고침
   * (그룹 생성 후 돌아왔을 때 새로운 그룹이 보이도록)
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGroups();
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * 그룹 목록 조회
   */
  const fetchGroups = async () => {
    try {
      setError('');
      const data = await groupApi.getMyGroups();
      setGroups(data);
    } catch (err: any) {
      console.error('그룹 목록 조회 에러:', err);
      setError(err.message || '그룹 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh 핸들러
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  /**
   * 그룹 생성 화면으로 이동
   */
  const goToCreateGroup = () => {
    navigation.navigate(ROUTES.GROUPS.CREATE_GROUP);
  };

  /**
   * 그룹 참여 화면으로 이동
   */
  const goToJoinGroup = () => {
    navigation.navigate(ROUTES.GROUPS.JOIN_GROUP);
  };

  /**
   * 그룹 상세 화면으로 이동
   */
  const goToGroupDetail = (groupId: number) => {
    navigation.navigate(ROUTES.GROUPS.GROUP_DETAIL, { groupId });
  };

  /**
   * 그룹 카드 렌더링 (그리드 형태)
   */
  const renderGroupItem = ({ item }: { item: GroupDto }) => {
    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => goToGroupDetail(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.groupCardBackground} />
        <View style={styles.groupCardIconContainer}>
          {item.icon ? (
            <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
          ) : (
            <Ionicons name="people" size={24} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.groupCardContent}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.groupMembers}>멤버 {item.memberCount}명</Text>
        </View>
        <View style={styles.groupCardProgress}>
          <View style={styles.groupCardProgressBar} />
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * 그룹 추가 카드 렌더링
   */
  const renderAddGroupCard = () => {
    return (
      <TouchableOpacity
        style={styles.addGroupCard}
        onPress={goToCreateGroup}
        activeOpacity={0.7}
      >
        <View style={styles.addGroupIconContainer}>
          <Ionicons name="add" size={24} color={COLORS.text.tertiary} />
        </View>
        <Text style={styles.addGroupText}>새 모임 만들기</Text>
      </TouchableOpacity>
    );
  };

  /**
   * 그룹 참여 카드 렌더링
   */
  const renderJoinGroupCard = () => {
    return (
      <TouchableOpacity
        style={styles.joinGroupCard}
        onPress={goToJoinGroup}
        activeOpacity={0.7}
      >
        <View style={styles.joinGroupIconContainer}>
          <Ionicons name="enter-outline" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.joinGroupText}>초대 코드로 참여</Text>
      </TouchableOpacity>
    );
  };

  /**
   * 빈 목록 렌더링
   */
  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="people-outline"
          size={64}
          color={COLORS.text.tertiary}
        />
        <Text style={styles.emptyTitle}>아직 그룹이 없습니다</Text>
        <Text style={styles.emptySubtitle}>
          새 그룹을 만들거나{'\n'}
          초대 코드로 그룹에 참여해보세요!
        </Text>
      </View>
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="그룹 목록을 불러오는 중..." />;
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
        onRetry={fetchGroups}
      />
    );
  }

  // 그리드용 데이터 (2열 그리드)
  const gridData = [
    { id: 'add', type: 'add' },
    { id: 'join', type: 'join' },
    ...groups.map((group) => ({ ...group, type: 'group' })),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={gridData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          if (item.type === 'add') {
            return renderAddGroupCard();
          }
          if (item.type === 'join') {
            return renderJoinGroupCard();
          }
          return renderGroupItem({ item: item as GroupDto });
        }}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    marginRight: 8,
  },
  groupCard: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  groupCardBackground: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 64,
    height: 64,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 32,
    opacity: 0.5,
  },
  groupCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  groupCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  groupMembers: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  groupCardProgress: {
    marginTop: 8,
    height: 4,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  groupCardProgressBar: {
    width: '50%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  addGroupCard: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGroupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  addGroupText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.tertiary,
  },
  joinGroupCard: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '48%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinGroupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  joinGroupText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
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
});
