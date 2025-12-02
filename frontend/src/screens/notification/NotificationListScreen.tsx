import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as notificationApi from '../../services/api/notificationApi';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { NotificationDto, NotificationType } from '../../types/notification.types';
import { COLORS } from '../../constants/colors';

/**
 * NotificationListScreen - 알림 목록 화면
 *
 * 사용자의 알림 목록을 표시하고 읽음 처리합니다.
 * 각 알림 클릭 시 해당하는 화면으로 이동합니다.
 */
export const NotificationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { showAlert } = useCustomAlert();

  // State
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  /**
   * 화면 진입 시 알림 목록 로드
   */
  useEffect(() => {
    fetchNotifications();
  }, []);

  /**
   * 알림 목록 조회
   */
  const fetchNotifications = async () => {
    try {
      setError('');
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error('알림 목록 조회 에러:', err);
      setError(err.message || '알림 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh 핸들러
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  /**
   * 알림 클릭 핸들러
   * 읽음 처리 후 관련 화면으로 이동
   */
  const handleNotificationPress = async (notification: NotificationDto) => {
    try {
      // 읽지 않은 알림인 경우 읽음 처리
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.id);

        // 로컬 상태 업데이트
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      // 알림 타입에 따라 관련 화면으로 이동
      navigateByNotificationType(notification.type, notification.relatedId);
    } catch (err: any) {
      console.error('알림 읽음 처리 에러:', err);
    }
  };

  /**
   * 알림 타입에 따라 화면 이동
   */
  const navigateByNotificationType = async (
    type: NotificationType,
    relatedId?: number
  ) => {
    if (!relatedId) {
      console.warn('관련 ID가 없습니다:', type);
      return;
    }

    try {
      switch (type) {
        case 'SETTLEMENT_REQUEST':
        case 'SETTLEMENT_REMINDER':
          // 정산 상세 화면으로 이동 (MainTab의 SettlementDetail)
          // relatedId는 settlementId
          navigation.navigate('MainTab', {
            screen: 'SettlementDetail',
            params: { settlementId: relatedId },
          });
          break;

        case 'VOTE_CREATED':
        case 'VOTE_CLOSE':
          // 투표 화면으로 이동 (MainTab의 Vote)
          // relatedId는 expenseId
          navigation.navigate('MainTab', {
            screen: 'Vote',
            params: { expenseId: relatedId },
          });
          break;

        case 'EXPENSE_ADDED':
          // 지출 상세 화면으로 이동 (MainTab의 ExpenseDetail)
          // relatedId는 expenseId
          navigation.navigate('MainTab', {
            screen: 'ExpenseDetail',
            params: { expenseId: relatedId },
          });
          break;

        case 'GROUP_INVITE':
          // 그룹 상세 화면으로 이동 (MainTab의 GroupDetail)
          // relatedId는 groupId
          navigation.navigate('MainTab', {
            screen: 'GroupDetail',
            params: { groupId: relatedId },
          });
          break;

        default:
          console.warn('알 수 없는 알림 타입:', type);
      }
    } catch (err: any) {
      console.error('화면 이동 중 에러:', err);
      showAlert({
        title: '오류',
        message: err.message || '화면 이동에 실패했습니다.',
      });
    }
  };

  /**
   * 알림 타입별 아이콘 반환
   */
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'SETTLEMENT_REQUEST':
      case 'SETTLEMENT_REMINDER':
        return { name: 'calculator', color: COLORS.system.warning };
      case 'VOTE_CREATED':
      case 'VOTE_CLOSE':
        return { name: 'checkbox', color: COLORS.primary };
      case 'EXPENSE_ADDED':
        return { name: 'receipt', color: COLORS.system.success };
      case 'GROUP_INVITE':
        return { name: 'people', color: COLORS.secondary };
      default:
        return { name: 'notifications', color: COLORS.text.tertiary };
    }
  };

  /**
   * 알림 카드 렌더링
   */
  const renderNotificationItem = ({ item }: { item: NotificationDto }) => {
    const iconInfo = getNotificationIcon(item.type);
    const isUnread = !item.isRead;

    // 시간 포맷팅 (예: "3시간 전", "2일 전")
    const formattedTime = formatRelativeTime(item.createdAt);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.notificationCard,
            isUnread ? styles.unreadCard : undefined,
          ]}
          elevation={isUnread}
        >
          <View style={styles.cardContent}>
            {/* 아이콘 */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${iconInfo.color}20` },
              ]}
            >
              <Ionicons
                name={iconInfo.name as any}
                size={24}
                color={iconInfo.color}
              />
            </View>

            {/* 내용 */}
            <View style={styles.contentContainer}>
              <Text
                style={[
                  styles.notificationText,
                  isUnread && styles.unreadText,
                ]}
                numberOfLines={2}
              >
                {item.content}
              </Text>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>

            {/* 읽지 않음 표시 */}
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  /**
   * 상대 시간 포맷팅
   */
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return '방금 전';
    } else if (diffMin < 60) {
      return `${diffMin}분 전`;
    } else if (diffHour < 24) {
      return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
      return `${diffDay}일 전`;
    } else {
      // 7일 이상이면 날짜 표시
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
  };

  /**
   * 빈 목록 렌더링
   */
  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="notifications-outline"
          size={64}
          color={COLORS.text.tertiary}
        />
        <Text style={styles.emptyTitle}>알림이 없습니다</Text>
        <Text style={styles.emptySubtitle}>
          새로운 알림이 오면{'\n'}
          여기에 표시됩니다
        </Text>
      </View>
    );
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return <LoadingSpinner fullScreen message="알림을 불러오는 중..." />;
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
        onRetry={fetchNotifications}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
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
  },
  emptyListContent: {
    flex: 1,
  },
  notificationCard: {
    marginVertical: 6,
  },
  unreadCard: {
    backgroundColor: COLORS.background.default,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
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
