import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Portal, Modal, IconButton, ActivityIndicator } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useChatAssistant } from '../../hooks/useChatAssistant';
import { COLORS } from '../../constants/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const FAB_SIZE = 56;

/**
 * ChatAssistant Component
 *
 * 전역 Floating Action Button과 채팅 모달을 제공하는 AI 어시스턴트 컴포넌트입니다.
 *
 * [기능]
 * - Global FAB: 화면 우측 하단에 고정된 버튼으로 채팅 모달 열기
 * - Chat Modal: 사용자와 AI 메시지를 표시하는 채팅 인터페이스
 * - 이미지 업로드: 최대 5개의 이미지를 선택하여 전송
 * - Markdown 렌더링: AI 응답에 포함된 마크다운 형식을 렌더링
 * - Auto-scroll: 새 메시지가 추가되면 자동으로 스크롤
 *
 * @example
 * ```tsx
 * import { ChatAssistant } from './components/common/ChatAssistant';
 *
 * export default function App() {
 *   return (
 *     <>
 *       <YourMainContent />
 *       <ChatAssistant />
 *     </>
 *   );
 * }
 * ```
 */
export const ChatAssistant: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // FAB 드래그 위치 관리
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - FAB_SIZE - 16,
      y: SCREEN_HEIGHT - FAB_SIZE - 100,
    })
  ).current;

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    pickImages,
    selectedImages,
    removeImage,
    clearChat,
  } = useChatAssistant();

  // 새 메시지 추가 시 자동 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // PanResponder 설정
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        // 화면 경계 체크
        let newX = (pan.x as any)._value;
        let newY = (pan.y as any)._value;

        // X 경계 제한
        if (newX < 0) newX = 0;
        if (newX > SCREEN_WIDTH - FAB_SIZE) newX = SCREEN_WIDTH - FAB_SIZE;

        // Y 경계 제한
        if (newY < 0) newY = 0;
        if (newY > SCREEN_HEIGHT - FAB_SIZE - 100) newY = SCREEN_HEIGHT - FAB_SIZE - 100;

        // 경계 내로 애니메이션
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();

        // 짧은 탭인 경우 모달 열기 (드래그가 아닌 경우)
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          openModal();
        }
      },
    })
  ).current;

  /**
   * 메시지 전송 핸들러
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedImages.length === 0) {
      return;
    }

    await sendMessage(inputText);
    setInputText('');
  };

  /**
   * 모달 열기
   */
  const openModal = () => {
    setIsModalVisible(true);
  };

  /**
   * 모달 닫기
   */
  const closeModal = () => {
    setIsModalVisible(false);
  };

  /**
   * 채팅 내역 초기화
   */
  const handleClearChat = () => {
    clearChat();
  };

  return (
    <>
      {/* Draggable Floating Action Button */}
      <Animated.View
        style={[
          styles.draggableFab,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.fabButton}>
          <IconButton icon="message-text-outline" iconColor={COLORS.white} size={28} />
        </View>
      </Animated.View>

      {/* Chat Modal */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <IconButton
                  icon="robot-outline"
                  size={28}
                  iconColor={COLORS.primary}
                />
                <Text style={styles.headerTitle}>AI 비서</Text>
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="delete-sweep"
                  size={24}
                  onPress={handleClearChat}
                  iconColor="#666"
                />
                <IconButton
                  icon="close"
                  size={24}
                  onPress={closeModal}
                  iconColor="#666"
                />
              </View>
            </View>

            {/* Messages List */}
            <KeyboardAwareScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid={true}
              enableAutomaticScroll={true}
              extraScrollHeight={20}
              showsVerticalScrollIndicator={true}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    안녕하세요! 정총무 AI 비서입니다.{'\n'}
                    무엇을 도와드릴까요?
                  </Text>
                </View>
              ) : (
                messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {/* 사용자 메시지에 첨부된 이미지 표시 */}
                    {message.role === 'user' && message.images && message.images.length > 0 && (
                      <View style={styles.messageImages}>
                        {message.images.map((uri, index) => (
                          <Image
                            key={index}
                            source={{ uri }}
                            style={styles.messageImage}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    )}

                    {/* 메시지 텍스트 */}
                    {message.role === 'user' ? (
                      <Text style={styles.userText}>{message.content}</Text>
                    ) : (
                      <Markdown style={markdownStyles}>{message.content}</Markdown>
                    )}

                    {/* 타임스탬프 */}
                    <Text style={styles.timestamp}>
                      {message.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                ))
              )}

              {/* 로딩 인디케이터 */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>AI가 답변을 생성 중입니다...</Text>
                </View>
              )}

              {/* 에러 메시지 */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </KeyboardAwareScrollView>

            {/* 선택된 이미지 미리보기 */}
            {selectedImages.length > 0 && (
              <View style={styles.selectedImagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.selectedImageWrapper}>
                      <Image source={{ uri }} style={styles.selectedImage} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(uri)}
                      >
                        <Text style={styles.removeImageText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImages}
                disabled={selectedImages.length >= 5}
              >
                <IconButton
                  icon="image-plus"
                  size={24}
                  iconColor={selectedImages.length >= 5 ? COLORS.text.disabled : COLORS.primary}
                />
                {selectedImages.length > 0 && (
                  <View style={styles.imageBadge}>
                    <Text style={styles.imageBadgeText}>{selectedImages.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="메시지를 입력하세요..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
                multiline
                maxLength={1000}
                editable={!isLoading}
                returnKeyType="default"
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() && selectedImages.length === 0) || isLoading
                    ? styles.sendButtonDisabled
                    : null,
                ]}
                onPress={handleSendMessage}
                disabled={(!inputText.trim() && selectedImages.length === 0) || isLoading}
              >
                <IconButton
                  icon="send"
                  size={24}
                  iconColor={
                    (!inputText.trim() && selectedImages.length === 0) || isLoading
                      ? COLORS.text.disabled
                      : COLORS.white
                  }
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  // Draggable FAB 스타일
  draggableFab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 1000,
  },

  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Modal 스타일
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    height: SCREEN_HEIGHT * 0.8,
  },

  modalContent: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Header 스타일
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: -4,
  },

  headerActions: {
    flexDirection: 'row',
  },

  // Messages 스타일
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  messagesContent: {
    padding: 16,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },

  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },

  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },

  messageImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },

  messageImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },

  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // Loading & Error 스타일
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },

  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },

  errorText: {
    color: '#C62828',
    fontSize: 14,
  },

  // 선택된 이미지 미리보기 스타일
  selectedImagesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  selectedImageWrapper: {
    position: 'relative',
    marginRight: 8,
  },

  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#C62828',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Input Area 스타일
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },

  imageButton: {
    position: 'relative',
    marginRight: 4,
  },

  imageBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },

  sendButton: {
    marginLeft: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});

/**
 * Markdown 렌더링 스타일
 */
const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 15,
    lineHeight: 20,
  },
  strong: {
    fontWeight: 'bold',
    color: '#000',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  code_inline: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  code_block: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 4,
  },
  link: {
    color: COLORS.info,
    textDecorationLine: 'underline',
  },
};
