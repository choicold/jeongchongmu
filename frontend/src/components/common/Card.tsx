import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * Card Props 타입 정의
 */
export interface CardProps {
  /** 카드 내부 컨텐츠 */
  children: React.ReactNode;
  /** 카드 클릭 시 호출될 함수 (없으면 터치 불가) */
  onPress?: () => void;
  /** 커스텀 스타일 */
  style?: StyleProp<ViewStyle>;
  /** 그림자 표시 여부 */
  elevation?: boolean;
  /** 패딩 제거 (children에서 직접 패딩 조절 시) */
  noPadding?: boolean;
}

/**
 * Card 컴포넌트
 * 재사용 가능한 카드 레이아웃 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * // 기본 카드
 * <Card>
 *   <Text>카드 내용</Text>
 * </Card>
 *
 * // 터치 가능한 카드
 * <Card onPress={() => navigation.navigate('Detail')}>
 *   <Text>클릭 가능한 카드</Text>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = true,
  noPadding = false,
}) => {
  const cardStyle = [
    styles.card,
    elevation && styles.shadow,
    noPadding && styles.noPadding,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.ui.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  noPadding: {
    padding: 0,
  },
});
