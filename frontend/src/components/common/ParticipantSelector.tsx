import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupMemberDto } from '../../types/group.types';
import { COLORS } from '../../constants/colors';

/**
 * ParticipantSelector Props 타입 정의
 */
export interface ParticipantSelectorProps {
  /** 그룹 멤버 목록 */
  members: GroupMemberDto[];
  /** 선택된 참여자 ID 목록 */
  selectedIds: number[];
  /** 선택 변경 콜백 */
  onSelectionChange: (selectedIds: number[]) => void;
  /** 다중 선택 허용 여부 (기본: true) */
  multiSelect?: boolean;
}

/**
 * ParticipantSelector 컴포넌트
 * 그룹 멤버 중 참여자를 선택할 수 있는 컴포넌트입니다.
 */
export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  members,
  selectedIds,
  onSelectionChange,
  multiSelect = true,
}) => {
  /**
   * 참여자 선택/해제 토글
   */
  const toggleParticipant = (userId: number) => {
    if (multiSelect) {
      // 다중 선택 모드
      if (selectedIds.includes(userId)) {
        // 이미 선택되어 있으면 제거
        onSelectionChange(selectedIds.filter((id) => id !== userId));
      } else {
        // 선택되어 있지 않으면 추가
        onSelectionChange([...selectedIds, userId]);
      }
    } else {
      // 단일 선택 모드
      onSelectionChange([userId]);
    }
  };

  /**
   * 전체 선택/해제
   */
  const toggleAll = () => {
    if (selectedIds.length === members.length) {
      // 전체 선택되어 있으면 전체 해제
      onSelectionChange([]);
    } else {
      // 전체 선택
      onSelectionChange(members.map((m) => m.user.id));
    }
  };

  const isAllSelected = selectedIds.length === members.length && members.length > 0;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          참여자 선택 ({selectedIds.length}/{members.length})
        </Text>
        {multiSelect && members.length > 0 && (
          <TouchableOpacity onPress={toggleAll} style={styles.selectAllButton}>
            <Text style={styles.selectAllText}>
              {isAllSelected ? '전체 해제' : '전체 선택'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 멤버 리스트 */}
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>그룹 멤버가 없습니다</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.memberList}
          contentContainerStyle={styles.memberListContent}
          nestedScrollEnabled
        >
          {members.map((member) => {
            const isSelected = selectedIds.includes(member.user.id);
            return (
              <TouchableOpacity
                key={member.user.id}
                onPress={() => toggleParticipant(member.user.id)}
                style={[
                  styles.memberItem,
                  isSelected && styles.memberItemSelected,
                ]}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.user.name}</Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'OWNER' ? '방장' : '멤버'}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  selectAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  memberList: {
    maxHeight: 300,
  },
  memberListContent: {
    gap: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 12,
  },
  memberItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 13,
    color: COLORS.text.tertiary,
  },
});
