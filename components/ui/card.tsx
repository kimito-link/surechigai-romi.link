// components/ui/card.tsx
// v6.19: 統一されたカードコンポーネント
// Card, PressableCard, HoverableCardを統合

import { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Platform,
  type ViewStyle,
} from "react-native";
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { color, shadows } from "@/theme/tokens";

// ==================== 型定義 ====================

export type CardVariant = "default" | "elevated" | "outlined" | "ghost";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
  /** PC表示でホバー効果を有効にするか */
  hoverable?: boolean;
  /** タップ時に触覚フィードバックを有効にするか */
  haptic?: boolean;
  /** 角丸のサイズ */
  borderRadius?: "sm" | "md" | "lg" | "xl";
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export interface CardFooterProps {
  children: React.ReactNode;
}

// ==================== スタイル定義 ====================

const paddingValues = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

const borderRadiusValues = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

const variantStyles = {
  default: {
    backgroundColor: color.surface,
    borderWidth: 0,
    borderColor: "transparent",
  },
  elevated: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 0,
    borderColor: "transparent",
    ...shadows.lg,
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: color.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==================== メインコンポーネント ====================

/**
 * 統一されたカードコンポーネント
 * 
 * UI/UXガイドに基づく設計:
 * - 一貫性: 統一されたスタイルとバリエーション
 * - タッチターゲット: クリック可能な場合は十分なサイズ
 * - 視覚的階層: 適切な影とボーダー
 * - PC対応: ホバー効果
 * 
 * @example
 * // 基本的な使い方
 * <Card>
 *   <Text>コンテンツ</Text>
 * </Card>
 * 
 * // クリック可能なカード
 * <Card onPress={handlePress} hoverable>
 *   <Text>クリックできるカード</Text>
 * </Card>
 * 
 * // ヘッダー・フッター付き
 * <Card>
 *   <CardHeader title="タイトル" subtitle="サブタイトル" />
 *   <Text>コンテンツ</Text>
 *   <CardFooter>
 *     <Button onPress={handleAction}>アクション</Button>
 *   </CardFooter>
 * </Card>
 */
export function Card({
  children,
  variant = "default",
  padding = "md",
  onPress,
  style,
  hoverable = false,
  haptic = true,
  borderRadius = "lg",
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const paddingValue = paddingValues[padding];
  const borderRadiusValue = borderRadiusValues[borderRadius];
  const variantStyle = variantStyles[variant];

  const handleHoverIn = useCallback(() => {
    if (Platform.OS === "web" && hoverable && onPress) {
      setIsHovered(true);
    }
  }, [hoverable, onPress]);

  const handleHoverOut = useCallback(() => {
    if (Platform.OS === "web") {
      setIsHovered(false);
    }
  }, []);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      setIsPressed(true);
      if (haptic && Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [onPress, haptic]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  // アニメーションスタイル
  const animatedStyle = useAnimatedStyle(() => {
    const scale = isPressed ? 0.97 : isHovered ? 1.02 : 1;
    const translateY = isHovered && !isPressed ? -4 : 0;

    return {
      transform: [
        { scale: withTiming(scale, { duration: 150, easing: Easing.out(Easing.cubic) }) },
        { translateY: withTiming(translateY, { duration: 150, easing: Easing.out(Easing.cubic) }) },
      ],
    };
  }, [isHovered, isPressed]);

  // Web用ホバースタイル
  const webHoverStyle: ViewStyle = Platform.OS === "web" && isHovered ? {
    shadowColor: color.hostAccentLegacy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderColor: color.hostAccentLegacy,
    borderWidth: 1,
  } : {};

  const cardStyle: ViewStyle = {
    ...variantStyle,
    padding: paddingValue,
    borderRadius: borderRadiusValue,
    overflow: "hidden",
  };

  // クリック可能な場合
  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          cardStyle,
          hoverable && animatedStyle,
          webHoverStyle,
          style,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  // 静的なカード
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
}

// ==================== CardHeader ====================

/**
 * カードヘッダー
 * 
 * @example
 * <CardHeader 
 *   title="チャレンジ名" 
 *   subtitle="2024年1月1日" 
 *   action={<IconButton icon="more-vert" onPress={handleMenu} />}
 * />
 */
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

// ==================== CardFooter ====================

/**
 * カードフッター
 * 
 * @example
 * <CardFooter>
 *   <Button onPress={handleCancel} variant="ghost">キャンセル</Button>
 *   <Button onPress={handleSubmit}>送信</Button>
 * </CardFooter>
 */
export function CardFooter({ children }: CardFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

// ==================== CardSection ====================

export interface CardSectionProps {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
}

/**
 * カード内のセクション区切り
 * 
 * @example
 * <Card>
 *   <CardSection title="基本情報">
 *     <Text>内容</Text>
 *   </CardSection>
 *   <CardSection title="詳細">
 *     <Text>詳細内容</Text>
 *   </CardSection>
 * </Card>
 */
export function CardSection({ children, title, noPadding }: CardSectionProps) {
  return (
    <View style={[styles.section, noPadding && styles.sectionNoPadding]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: color.textWhite,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: color.textMuted,
  },
  action: {
    marginLeft: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: 12,
  },
  section: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  sectionNoPadding: {
    paddingVertical: 0,
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
});

export default Card;
