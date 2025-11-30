import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as groupApi from '../../services/api/groupApi';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateGroup'>;

/**
 * CreateGroupScreen - 그룹 생성 화면
 *
 * 새로운 그룹을 생성합니다.
 * 그룹명과 설명을 입력받아 그룹을 생성하고, 생성된 그룹의 상세 화면으로 이동합니다.
 */
export const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();

  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('airplane');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState('');

  // 아이콘 목록 (Ionicons 이름)
  const icons = [
    'airplane',
    'beer',
    'cafe',
    'home',
    'gift',
    'football',
    'mic',
    'cart',
    'earth',
    'school',
  ];

  /**
   * 입력값 검증
   */
  const validateInputs = (): boolean => {
    let isValid = true;

    // 그룹명 검증
    if (!name.trim()) {
      setNameError('그룹명을 입력해주세요.');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('그룹명은 최소 2자 이상이어야 합니다.');
      isValid = false;
    } else if (name.trim().length > 50) {
      setNameError('그룹명은 최대 50자까지 입력 가능합니다.');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };

  /**
   * 그룹 생성 처리
   */
  const handleCreateGroup = async () => {
    // 에러 초기화
    setError('');

    // 입력값 검증
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      // API 호출
      const newGroup = await groupApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
      });

      // 성공 알림
      showToast(`"${newGroup.name}" 그룹이 생성되었습니다.`, 'success');

      // Toast를 볼 수 있도록 약간의 딜레이 후 이동
      setTimeout(() => {
        // 스택을 초기화하고 GroupDetail로 이동 (뒤로가기 시 GroupList로 가도록)
        navigation.reset({
          index: 1,
          routes: [
            { name: 'GroupList' },
            {
              name: ROUTES.GROUPS.GROUP_DETAIL,
              params: { groupId: newGroup.id }
            }
          ],
        });
      }, 500);
    } catch (err: any) {
      console.error('그룹 생성 에러:', err);
      setError(err.message || '그룹 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>그룹 생성</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 아이콘 선택 */}
          <View style={styles.iconSection}>
            <View style={styles.selectedIconContainer}>
              <Ionicons
                name={selectedIcon as any}
                size={48}
                color={COLORS.primary}
              />
              <View style={styles.iconBadge}>
                <Ionicons name="add" size={16} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.iconLabel}>모임을 대표할 아이콘을 선택하세요</Text>
          </View>

          {/* 아이콘 선택 버튼들 */}
          <View style={styles.iconGrid}>
            {icons.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  selectedIcon === icon && styles.iconButtonSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={selectedIcon === icon ? COLORS.primary : COLORS.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* 입력 폼 */}
          <View style={styles.form}>
            {/* 그룹명 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                모임 이름 <Text style={styles.required}>*</Text>
              </Text>
              <Input
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setNameError('');
                  setError('');
                }}
                placeholder="예: 제주도 여행, 불금 파티"
                error={nameError}
                maxLength={50}
              />
            </View>

            {/* 설명 (선택사항) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>한줄 설명 (선택)</Text>
              <Input
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setError('');
                }}
                placeholder="모임의 목적을 입력해주세요"
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* 에러 메시지 */}
            {error && (
              <View style={styles.errorContainer}>
                <ErrorMessage
                  message={error}
                  showIcon={false}
                  style={styles.error}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 고정 버튼 */}
        <View style={styles.bottomContainer}>
          <Button
            title="모임 생성 완료"
            onPress={handleCreateGroup}
            variant="primary"
            loading={loading}
            disabled={loading || !name.trim()}
            style={styles.createButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  selectedIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border.default,
    borderStyle: 'dashed',
    position: 'relative',
    marginBottom: 16,
  },
  iconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  iconLabel: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  iconButtonSelected: {
    backgroundColor: COLORS.background.tertiary,
    borderColor: COLORS.primary,
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  required: {
    color: COLORS.primary,
  },
  errorContainer: {
    marginBottom: 16,
  },
  error: {
    padding: 0,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  createButton: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});
