import { Pressable, Platform, type PressableProps, type ViewStyle } from "react-native";
import { color } from "@/theme/tokens";
import { useState, useCallback } from "react";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface PressableCardProps extends Omit<PressableProps, "style"> {
  style?: ViewStyle;
  hoverStyle?: ViewStyle;
  pressedStyle?: ViewStyle;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PC表示でホバー効果を持つカードコンポーネント
 * UXガイドライン: マウスデバイスではホバー効果を適用
 */
export function PressableCard({
  style,
  hoverStyle,
  pressedStyle,
  children,
  onPress,
  ...props
}: PressableCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleHoverIn = useCallback(() => {
    if (Platform.OS === "web") {
      setIsHovered(true);
    }
  }, []);

  const handleHoverOut = useCallback(() => {
    if (Platform.OS === "web") {
      setIsHovered(false);
    }
  }, []);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    // ハプティックフィードバック（ネイティブのみ）
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  // アニメーションスタイル（よりスムーズなイージング）
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

  // Web用のホバースタイル（より目立つ効果）
  const webHoverStyle: ViewStyle = Platform.OS === "web" && isHovered ? {
    shadowColor: color.hostAccentLegacy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderColor: color.hostAccentLegacy,
    borderWidth: 2,
  } : {};

  return (
    <AnimatedPressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        animatedStyle,
        webHoverStyle,
        isPressed && pressedStyle,
      ]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
