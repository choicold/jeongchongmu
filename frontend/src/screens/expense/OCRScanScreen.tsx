import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExpenseItemList } from '../../components/expense/ExpenseItemList';
import * as OCRService from '../../services/OCRService';
import { useCustomAlert } from '../../contexts/CustomAlertContext';
import { OcrResultDTO } from '../../types/ocr.types';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

type Props = NativeStackScreenProps<GroupsStackParamList, 'OCRScan'>;

/**
 * OCRScanScreen - 영수증 스캔 및 OCR 분석 화면
 *
 * 카메라로 영수증을 촬영하고, OCR 결과를 받아 지출 등록 폼에 자동 입력합니다.
 */
export const OCRScanScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { showAlert } = useCustomAlert();

  // State
  const [image, setImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  /**
   * 화면 진입 시 카메라 권한 요청
   */
  useEffect(() => {
    requestCameraPermission();
  }, []);

  /**
   * 카메라 권한 요청
   */
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        showAlert({
          title: '권한 필요',
          message: '영수증 촬영을 위해 카메라 권한이 필요합니다.',
          buttons: [
            { text: '취소', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error('권한 요청 에러:', error);
      setHasPermission(false);
    }
  };

  /**
   * 카메라로 사진 촬영
   */
  const handleTakePhoto = async () => {
    if (!hasPermission) {
      showAlert({
        title: '권한 없음',
        message: '카메라 권한이 필요합니다.',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        setOcrResult(null); // 이전 결과 초기화
      }
    } catch (error: any) {
      console.error('사진 촬영 에러:', error);
      showAlert({
        title: '촬영 실패',
        message: '사진 촬영에 실패했습니다.',
      });
    }
  };

  /**
   * 갤러리에서 사진 선택
   */
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        setOcrResult(null); // 이전 결과 초기화
      }
    } catch (error: any) {
      console.error('이미지 선택 에러:', error);
      showAlert({
        title: '선택 실패',
        message: '이미지 선택에 실패했습니다.',
      });
    }
  };

  /**
   * OCR 분석 실행
   */
  const handleAnalyzeImage = async () => {
    if (!image) {
      showAlert({
        title: '이미지 없음',
        message: '먼저 영수증 사진을 촬영해주세요.',
      });
      return;
    }

    // 이미지 URI 검증
    if (!OCRService.validateImageUri(image)) {
      showAlert({
        title: '오류',
        message: '올바르지 않은 이미지입니다.',
      });
      return;
    }

    try {
      setLoading(true);

      // OCR 분석 호출
      const result = await OCRService.scanReceipt(image);
      setOcrResult(result);

      // 결과 검증
      const validation = OCRService.validateOcrResult(result);
      if (!validation.isValid) {
        showAlert({
          title: 'OCR 결과 확인 필요',
          message: `다음 항목을 확인해주세요:\n\n${validation.errors.join('\n')}`,
          buttons: [{ text: '확인' }],
        });
      }
    } catch (error: any) {
      console.error('OCR 분석 에러:', error);
      showAlert({
        title: 'OCR 분석 실패',
        message: error.message || 'OCR 분석에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 결과를 CreateExpenseScreen으로 전달하며 이동
   */
  const handleRegisterExpense = () => {
    if (!ocrResult) {
      showAlert({
        title: 'OCR 결과 없음',
        message: '먼저 영수증을 분석해주세요.',
      });
      return;
    }

    // CreateExpenseScreen으로 이동하며 OCR 결과 전달
    // replace를 사용하여 뒤로가기 시 OCRScan 화면이 스택에 남지 않도록
    navigation.replace(ROUTES.EXPENSES.CREATE_EXPENSE, {
      groupId,
      ocrResult,
    });
  };

  /**
   * 다시 촬영
   */
  const handleRetake = () => {
    setImage(null);
    setOcrResult(null);
  };

  /**
   * 권한 확인 중
   */
  if (hasPermission === null) {
    return <LoadingSpinner fullScreen message="권한 확인 중..." />;
  }

  /**
   * 권한 거부됨
   */
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <Ionicons
            name="close-circle-outline"
            size={64}
            color={COLORS.text.tertiary}
          />
          <Text style={styles.permissionTitle}>카메라 권한 필요</Text>
          <Text style={styles.permissionText}>
            영수증 촬영을 위해 카메라 권한이 필요합니다.{'\n'}
            설정에서 권한을 허용해주세요.
          </Text>
          <Button
            title="권한 요청"
            onPress={requestCameraPermission}
            variant="primary"
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 커스텀 헤더 */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>영수증 스캔</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 서브타이틀 */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            영수증 사진을 촬영하면 자동으로 정보를 인식합니다
          </Text>
        </View>

        {/* 이미지 촬영/선택 */}
        {!image ? (
          <Card style={styles.section}>
            <View style={styles.emptyImageContainer}>
              <Ionicons
                name="camera-outline"
                size={64}
                color={COLORS.text.tertiary}
              />
              <Text style={styles.emptyImageText}>영수증을 촬영해주세요</Text>
            </View>
            <View style={styles.buttonGroup}>
              <Button
                title="사진 촬영"
                onPress={handleTakePhoto}
                variant="primary"
                style={styles.halfButton}
              />
              <Button
                title="갤러리 선택"
                onPress={handlePickImage}
                variant="secondary"
                style={styles.halfButton}
              />
            </View>
          </Card>
        ) : (
          <>
            {/* 촬영한 이미지 미리보기 */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>영수증 이미지</Text>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <View style={styles.buttonGroup}>
                <Button
                  title="다시 촬영"
                  onPress={handleRetake}
                  variant="secondary"
                  style={styles.halfButton}
                />
                <Button
                  title="OCR 분석"
                  onPress={handleAnalyzeImage}
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  style={styles.halfButton}
                />
              </View>
            </Card>

            {/* OCR 분석 중 */}
            {loading && (
              <Card style={styles.section}>
                <LoadingSpinner message="영수증을 분석하는 중..." />
              </Card>
            )}

            {/* OCR 결과 */}
            {ocrResult && !loading && (
              <>
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>인식 결과</Text>

                  {/* 제목 */}
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>제목</Text>
                    <Text style={styles.resultValue}>{ocrResult.title}</Text>
                  </View>

                  {/* 총 금액 */}
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>총 금액</Text>
                    <Text style={[styles.resultValue, styles.amountText]}>
                      {ocrResult.amount.toLocaleString()}원
                    </Text>
                  </View>
                </Card>

                {/* 세부 항목 */}
                {ocrResult.items && ocrResult.items.length > 0 && (
                  <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>세부 항목</Text>
                    <ExpenseItemList items={ocrResult.items} showTotal />
                  </Card>
                )}

                {/* 안내 메시지 */}
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.infoText}>
                    인식 결과가 정확하지 않을 수 있습니다.{'\n'}
                    등록 화면에서 수정할 수 있습니다.
                  </Text>
                </View>

                {/* 등록 버튼 */}
                <Button
                  title="이 내용으로 등록하기"
                  onPress={handleRegisterExpense}
                  variant="primary"
                  style={styles.registerButton}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  customHeader: {
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
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  emptyImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border.default,
  },
  emptyImageText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
    borderRadius: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#ECFDF5', // emerald-50
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0', // emerald-200
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#047857', // emerald-700
    marginLeft: 12,
    lineHeight: 20,
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // 권한 거부 화면
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    minWidth: 200,
    borderRadius: 12,
  },
});
