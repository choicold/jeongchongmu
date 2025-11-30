import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../navigation/MainNavigator';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS } from '../../constants/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

/**
 * ProfileEditScreen - 프로필 수정 화면
 *
 * 사용자 정보를 수정할 수 있는 화면입니다.
 */
export const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [loading, setLoading] = useState(false);

  /**
   * 프로필 수정 처리
   */
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    if (!bankName.trim()) {
      Alert.alert('오류', '은행명을 입력해주세요.');
      return;
    }

    if (!accountNumber.trim()) {
      Alert.alert('오류', '계좌번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        name: name.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      });

      Alert.alert('성공', '프로필이 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('프로필 수정 실패:', error);
      Alert.alert('오류', error.message || '프로필 수정에 실패했습니다.');
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
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          {user?.email && (
            <View style={styles.emailInfoContainer}>
              <Text style={styles.emailLabel}>이메일</Text>
              <Text style={styles.emailValue}>{user.email}</Text>
            </View>
          )}

          <Input
            label="이름"
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력하세요"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계좌 정보</Text>

          <Input
            label="은행명"
            value={bankName}
            onChangeText={setBankName}
            placeholder="은행명을 입력하세요"
          />

          <Input
            label="계좌번호"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="계좌번호를 입력하세요"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="취소"
            onPress={() => navigation.goBack()}
            variant="secondary"
            fullWidth={false}
            style={styles.button}
          />
          <Button
            title="저장"
            onPress={handleSubmit}
            loading={loading}
            fullWidth={false}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  emailInfoContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 14,
    color: COLORS.text.disabled,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  button: {
    minWidth: 120,
    paddingHorizontal: 32,
  },
});
