import { Pressable, Platform, View, type PressableProps, type ViewStyle, StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState, useCallback } from "react";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface HoverableListItemProps extends Omit<PressableProps, "style"> {
  style?: ViewStyle;
  children: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PC表示でホバー効果を持つリストアイテムコンポーネント
 * Apple HIG準拠: 最小タップエリア44px
 */
export function HoverableListItem({
  style,
  children,
  showChevron = true,
  disabled = false,
  onPress,
  ...props
}: HoverableListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleHoverIn = useCallback(() => {
    if (Platform.OS === "web" && !disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleHoverOut = useCallback(() => {
    if (Platform.OS === "web") {
      setIsHovered(false);
    }
  }, []);

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  // アニメーションスタイル
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = disabled ? 0.5 : isPressed ? 0.7 : 1;

    return {
      opacity: withTiming(opacity, { duration: 100 }),
    };
  }, [isPressed, disabled]);

  // ホバー時の背景色
  const hoverBackgroundStyle: ViewStyle = Platform.OS === "web" && isHovered && !disabled ? {
    backgroundColor: palette.orange500 + "14",
  } : {};

  // ホバー時の左ボーダー
  const hoverBorderStyle: ViewStyle = Platform.OS === "web" && isHovered && !disabled ? {
    borderLeftWidth: 3,
    borderLeftColor: color.hostAccentLegacy,
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
        styles.container,
        animatedStyle,
        hoverBackgroundStyle,
        hoverBorderStyle,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {children}
      </View>
      {showChevron && (
        <View style={[styles.chevron, isHovered && styles.chevronHovered]}>
          <ChevronIcon color={isHovered ? color.hostAccentLegacy : color.textSecondary} />
        </View>
      )}
    </AnimatedPressable>
  );
}

// シンプルなシェブロンアイコン
function ChevronIcon({ color }: { color: string }) {
  return (
    <View style={[styles.chevronIcon, { borderColor: color }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56, // Apple HIG準拠（44px以上）
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: color.surface,
    borderRadius: 12,
    marginVertical: 4,
  },
  content: {
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.6,
  },
  chevronHovered: {
    opacity: 1,
  },
  chevronIcon: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "-45deg" }],
  },
});
