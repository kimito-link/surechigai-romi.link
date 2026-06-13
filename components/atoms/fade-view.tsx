/**
 * FadeView Component
 * 白画面のちらつきを防ぐためのフェードイン/アウトコンポーネント
 */

import { useEffect, useRef, ReactNode } from "react";
import { Animated, Platform, ViewStyle } from "react-native";
import { SKELETON_CONFIG } from "@/constants/skeleton-config";

interface FadeViewProps {
  children: ReactNode;
  visible: boolean;
  duration?: number;
  style?: ViewStyle;
}

export function FadeView({
  children,
  visible,
  duration = SKELETON_CONFIG.fadeDuration,
  style,
}: FadeViewProps) {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [visible, duration, fadeAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
