import { Pressable, Platform, type PressableProps, type ViewStyle, StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState, useCallback } from "react";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useHoverEffects } from "@/hooks/use-responsive";

interface HoverableCardProps extends Omit<PressableProps, "style"> {
  style?: ViewStyle;
  children: React.ReactNode;
  /** ホバー時のスケール（デフォルト: 1.02） */
  hoverScale?: number;
  /** プレス時のスケール（デフォルト: 0.97） */
  pressScale?: number;
  /** ホバー時の上昇量（デフォルト: 4） */
  hoverLift?: number;
  /** ホバー時のボーダーカラー */
  hoverBorderColor?: string;
  /** ホバー時のシャドウカラー */
  hoverShadowColor?: string;
  /** ハプティクスを有効にするか（デフォルト: true） */
  haptic?: boolean;
  /** 無効状態 */
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PC表示でホバー効果を持つカードコンポーネント
 * - デスクトップ: ホバー時にスケールアップ、上昇、シャドウ強化
 * - モバイル: タップ時にスケールダウン、ハプティクス
 * - Apple HIG準拠: 最小タップエリア44px
 */
export function HoverableCard({
  style,
  children,
  hoverScale = 1.02,
  pressScale = 0.97,
  hoverLift = 4,
  hoverBorderColor = color.hostAccentLegacy,
  hoverShadowColor = color.hostAccentLegacy,
  haptic = true,
  disabled = false,
  onPress,
  ...props
}: HoverableCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const enableHover = useHoverEffects();

  const handleHoverIn = useCallback(() => {
    if (enableHover && !disabled) {
      setIsHovered(true);
    }
  }, [enableHover, disabled]);

  const handleHoverOut = useCallback(() => {
    if (enableHover) {
      setIsHovered(false);
    }
  }, [enableHover]);

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
      if (haptic && Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [disabled, haptic]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  // アニメーションスタイル
  const animatedStyle = useAnimatedStyle(() => {
    const scale = isPressed ? pressScale : isHovered ? hoverScale : 1;
    const translateY = isHovered && !isPressed ? -hoverLift : 0;
    const opacity = disabled ? 0.5 : 1;

    return {
      transform: [
        { scale: withTiming(scale, { duration: 150, easing: Easing.out(Easing.cubic) }) },
        { translateY: withTiming(translateY, { duration: 150, easing: Easing.out(Easing.cubic) }) },
      ],
      opacity: withTiming(opacity, { duration: 150 }),
    };
  }, [isHovered, isPressed, disabled, hoverScale, pressScale, hoverLift]);

  // Web用のホバースタイル
  const webHoverStyle: ViewStyle = enableHover && isHovered && !disabled ? {
    shadowColor: hoverShadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderColor: hoverBorderColor,
    borderWidth: 2,
  } : {};

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        style,
        animatedStyle,
        webHoverStyle,
      ]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * チャレンジカード用のホバー効果付きコンポーネント
 * - グラデーション背景に最適化
 * - より控えめなホバー効果
 */
export function HoverableChallengeCard({
  style,
  children,
  ...props
}: Omit<HoverableCardProps, "hoverScale" | "pressScale" | "hoverLift">) {
  return (
    <HoverableCard
      style={StyleSheet.flatten([styles.challengeCard, style])}
      hoverScale={1.015}
      pressScale={0.98}
      hoverLift={3}
      {...props}
    >
      {children}
    </HoverableCard>
  );
}

/**
 * メニューアイテム用のホバー効果付きコンポーネント
 * - 左ボーダーのアクセント
 * - 背景色の変化
 */
export function HoverableMenuItem({
  style,
  children,
  disabled = false,
  onPress,
  ...props
}: Omit<HoverableCardProps, "hoverScale" | "pressScale" | "hoverLift">) {
  const [isHovered, setIsHovered] = useState(false);
  const enableHover = useHoverEffects();

  const handleHoverIn = useCallback(() => {
    if (enableHover && !disabled) {
      setIsHovered(true);
    }
  }, [enableHover, disabled]);

  const handleHoverOut = useCallback(() => {
    if (enableHover) {
      setIsHovered(false);
    }
  }, [enableHover]);

  // ホバー時のスタイル
  const hoverStyle: ViewStyle = enableHover && isHovered && !disabled ? {
    backgroundColor: palette.orange500 + "14",
    borderLeftWidth: 3,
    borderLeftColor: color.hostAccentLegacy,
  } : {};

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.menuItem,
        style,
        hoverStyle,
        pressed && styles.menuItemPressed,
        disabled && styles.menuItemDisabled,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44, // Apple HIG準拠
  },
  challengeCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: color.surface,
    borderRadius: 12,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});
