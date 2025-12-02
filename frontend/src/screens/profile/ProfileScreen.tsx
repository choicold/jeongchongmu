import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../navigation/MainNavigator';
import { useAuth } from '../../context/AuthContext';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../constants/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

/**
 * ProfileScreen - 프로필 화면
 *
 * 사용자 정보 조회 및 로그아웃 기능을 제공합니다.
 */
export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showAlert } = useCustomAlert();

  /**
   * 로그아웃 처리
   */
  const handleLogout = () => {
    showAlert({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      buttons: [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('로그아웃 실패:', error);
              showAlert({
                title: '오류',
                message: '로그아웃에 실패했습니다.',
              });
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>{user?.name || '사용자'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>

        {/* 계좌 정보 */}
        {user?.bankName && user?.accountNumber && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>계좌 정보</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>은행</Text>
              <Text style={styles.infoValue}>{user.bankName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>계좌번호</Text>
              <Text style={styles.infoValue}>{user.accountNumber}</Text>
            </View>
          </Card>
        )}

        {/* 프로필 수정 및 로그아웃 버튼 */}
        <View style={styles.buttonRow}>
          <Button
            title="프로필 수정"
            onPress={() => navigation.navigate('ProfileEdit')}
            variant="primary"
            fullWidth={false}
            style={styles.actionButton}
          />
          <Button
            title="로그아웃"
            onPress={handleLogout}
            variant="secondary"
            fullWidth={false}
            style={styles.actionButton}
          />
        </View>

        {/* 앱 정보 */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>앱 정보</Text>
          </View>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>버전 정보</Text>
            <View style={styles.menuRight}>
              <Text style={styles.versionText}>1.0.0</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    maxWidth: 150,
  },
});
