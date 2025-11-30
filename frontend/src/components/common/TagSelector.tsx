import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * TagSelector Props 타입 정의
 */
export interface TagSelectorProps {
  /** 선택된 태그 목록 */
  selectedTags: string[];
  /** 태그 변경 콜백 */
  onTagsChange: (tags: string[]) => void;
  /** 추천 태그 목록 (옵션) */
  suggestedTags?: string[];
}

/**
 * TagSelector 컴포넌트
 * 태그를 추가/제거할 수 있는 컴포넌트입니다.
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  suggestedTags = ['식사', '교통', '숙박', '관광', '쇼핑', '기타'],
}) => {
  const [inputText, setInputText] = useState('');

  /**
   * 태그 추가
   */
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (selectedTags.includes(trimmedTag)) return;

    onTagsChange([...selectedTags, trimmedTag]);
    setInputText('');
  };

  /**
   * 태그 제거
   */
  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  /**
   * 추천 태그 토글
   */
  const toggleSuggestedTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  };

  return (
    <View style={styles.container}>
      {/* 입력 필드 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="태그 입력 (예: 회식, 저녁)"
            placeholderTextColor={COLORS.text.secondary}
            onSubmitEditing={() => addTag(inputText)}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          onPress={() => addTag(inputText)}
          style={styles.addButton}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="add-circle"
            size={28}
            color={inputText.trim() ? COLORS.primary : COLORS.text.disabled}
          />
        </TouchableOpacity>
      </View>

      {/* 선택된 태그 */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <Text style={styles.sectionLabel}>선택된 태그</Text>
          <View style={styles.tagsWrapper}>
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => removeTag(tag)}
                style={styles.selectedTag}
              >
                <Text style={styles.selectedTagText}>{tag}</Text>
                <Ionicons name="close-circle" size={18} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 추천 태그 */}
      {suggestedTags.length > 0 && (
        <View style={styles.suggestedTagsContainer}>
          <Text style={styles.sectionLabel}>추천 태그</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedTagsScroll}
          >
            {suggestedTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleSuggestedTag(tag)}
                  style={[
                    styles.suggestedTag,
                    isSelected && styles.suggestedTagSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestedTagText,
                      isSelected && styles.suggestedTagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  addButton: {
    padding: 4,
  },
  selectedTagsContainer: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  suggestedTagsContainer: {
    marginTop: 16,
  },
  suggestedTagsScroll: {
    gap: 8,
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.default,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  suggestedTagSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background.secondary,
  },
  suggestedTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  suggestedTagTextSelected: {
    color: COLORS.primary,
  },
  checkIcon: {
    marginLeft: 2,
  },
});
