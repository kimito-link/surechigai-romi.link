import { useRef, useEffect } from "react";
import { Animated, Pressable, StyleSheet, ViewStyle, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { usePressAnimation } from "@/lib/animations";
import { touchTarget } from "@/constants/design-system";

interface AnimatedListItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  delay?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * アニメーション付きリストアイテム
 * 
 * UI/UXガイドに基づく設計:
 * - 滑らかなトランジション: フェードイン + スライドイン
 * - プレスフィードバック: スケール + 触覚
 * - 遅延アニメーション: リストアイテムの順次表示
 */
export function AnimatedListItem({
  children,
  onPress,
  delay = 0,
  style,
  disabled = false,
}: AnimatedListItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, fadeAnim, translateY]);

  const content = (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress && !disabled) {
    const handlePressIn = () => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPressIn();
    };

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={({ pressed }) => [
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    minHeight: touchTarget.minSize,
  },
});
