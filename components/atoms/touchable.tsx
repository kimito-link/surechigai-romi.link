// components/atoms/touchable.tsx
// 汎用タッチターゲットラッパー（IconButtonとは別用途で維持）

import { Pressable, PressableProps, StyleSheet, Platform, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { touchTarget } from "@/constants/design-system";

interface TouchableProps extends Omit<PressableProps, "style"> {
  haptic?: boolean;
  hapticType?: "light" | "medium" | "heavy";
  style?: ViewStyle;
}

/**
 * アクセシビリティ対応のタッチターゲットラッパー
 * 
 * UI/UXガイドに基づく設計:
 * - 最小タッチターゲット: 44x44px (Apple HIG準拠)
 * - 触覚フィードバック: タップ時のハプティクス
 * - アクセシビリティ: 十分なタップ領域
 * 
 * @note ボタンとして使用する場合は components/ui/button の Button または IconButton を使用してください
 */
export function Touchable({
  children,
  onPress,
  haptic = true,
  hapticType = "light",
  style,
  ...props
}: TouchableProps) {
  const handlePress = () => {
    if (haptic && Platform.OS !== "web") {
      const hapticStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticType];
      Haptics.impactAsync(hapticStyle);
    }
    onPress?.({} as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.touchable,
        style,
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    minWidth: touchTarget.minSize,
    minHeight: touchTarget.minSize,
    justifyContent: "center",
    alignItems: "center",
  },
});
