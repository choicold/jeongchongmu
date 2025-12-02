import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import * as groupMemberApi from '../../services/api/groupMemberApi';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = NativeStackScreenProps<GroupsStackParamList, 'JoinGroup'>;

/**
 * JoinGroupScreen - 그룹 참여 화면
 *
 * 초대 코드를 입력하여 그룹에 참여합니다.
 * 참여 성공 시 해당 그룹의 상세 화면으로 이동합니다.
 */
export const JoinGroupScreen: React.FC<Props> = ({ navigation }) => {
  const { showAlert } = useCustomAlert();

  // State
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation error
  const [inviteCodeError, setInviteCodeError] = useState('');

  /**
   * 입력값 검증
   */
  const validateInputs = (): boolean => {
    let isValid = true;

    // 초대 코드 검증
    if (!inviteCode.trim()) {
      setInviteCodeError('초대 코드를 입력해주세요.');
      isValid = false;
    } else if (inviteCode.trim().length < 6) {
      setInviteCodeError('초대 코드는 최소 6자 이상이어야 합니다.');
      isValid = false;
    } else {
      setInviteCodeError('');
    }

    return isValid;
  };

  /**
   * 그룹 참여 처리
   */
  const handleJoinGroup = async () => {
    // 에러 초기화
    setError('');

    // 입력값 검증
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      // API 호출
      const member = await groupMemberApi.joinGroup({
        inviteCode: inviteCode.trim().toUpperCase(), // 대문자로 변환
      });

      // 참여 성공
      showAlert({
        title: '그룹 참여 완료',
        message: `그룹에 성공적으로 참여했습니다!`,
        buttons: [
          {
            text: '확인',
            onPress: () => {
              // 그룹 상세 화면으로 이동 (스택에서 JoinGroup 제거)
              navigation.replace(ROUTES.GROUPS.GROUP_DETAIL, {
                groupId: member.groupId,
              });
            },
          },
        ],
      });
    } catch (err: any) {
      console.error('그룹 참여 에러:', err);
      setError(err.message || '그룹 참여에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 네비게이션 헤더 */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navHeaderTitle}>그룹 참여</Text>
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
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="people-circle" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>그룹 참여</Text>
            <Text style={styles.subtitle}>
              친구에게 받은 초대 코드를 입력하여{'\n'}
              그룹에 참여하세요
            </Text>
          </View>

          {/* 그룹 참여 폼 */}
          <View style={styles.form}>
            {/* 초대 코드 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                초대 코드 <Text style={styles.required}>*</Text>
              </Text>
              <Input
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(text.toUpperCase()); // 자동 대문자 변환
                  setInviteCodeError('');
                  setError('');
                }}
                placeholder="ABC123"
                autoCapitalize="characters"
                autoCorrect={false}
                error={inviteCodeError}
                maxLength={20}
                contextMenuHidden={false}
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

            {/* 참여하기 버튼 */}
            <Button
              title="그룹 참여하기"
              onPress={handleJoinGroup}
              variant="primary"
              loading={loading}
              disabled={loading || !inviteCode.trim()}
              style={styles.joinButton}
            />

            {/* 안내 메시지 */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 초대 코드란?</Text>
              <Text style={styles.infoText}>
                그룹을 만든 사람이 공유하는 6자리 이상의 코드입니다.{'\n'}
                초대 코드를 입력하면 해당 그룹에 바로 참여할 수 있어요!
              </Text>
            </View>

            {/* 추가 안내 */}
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                📌 초대 코드를 받지 못하셨나요?{'\n'}
                그룹 생성자에게 요청하거나, 그룹 상세 화면에서{'\n'}
                초대 코드를 확인할 수 있습니다.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  navHeader: {
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
  navHeaderTitle: {
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
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
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
  joinButton: {
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  infoBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  tipBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    lineHeight: 20,
  },
});
