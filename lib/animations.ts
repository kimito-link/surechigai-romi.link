import { Animated, Easing, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { animation } from "@/constants/design-system";

/**
 * アニメーションユーティリティ
 * 
 * UI/UXガイドに基づく設計:
 * - 控えめなアニメーション: 300ms以下
 * - 目的のあるアニメーション: フィードバック、状態変化
 * - 減少モーション対応: アクセシビリティ設定を尊重
 * - WebではuseNativeDriverをfalseに（RCTAnimation未対応のため）
 */
export const USE_NATIVE_DRIVER = Platform.OS !== "web";

// フェードイン
export function fadeIn(
  animValue: Animated.Value,
  duration = animation.duration.normal,
  callback?: () => void
) {
  return Animated.timing(animValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start(callback);
}

// フェードアウト
export function fadeOut(
  animValue: Animated.Value,
  duration = animation.duration.normal,
  callback?: () => void
) {
  return Animated.timing(animValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start(callback);
}

// スケールイン
export function scaleIn(
  animValue: Animated.Value,
  duration = animation.duration.normal,
  callback?: () => void
) {
  animValue.setValue(0.9);
  return Animated.spring(animValue, {
    toValue: 1,
    useNativeDriver: USE_NATIVE_DRIVER,
    tension: 100,
    friction: 10,
  }).start(callback);
}

// プレスフィードバック
export function pressScale(
  animValue: Animated.Value,
  pressed: boolean,
  scale = 0.97
) {
  return Animated.timing(animValue, {
    toValue: pressed ? scale : 1,
    duration: animation.duration.fast,
    easing: Easing.out(Easing.ease),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start();
}

// スライドイン（上から）
export function slideInFromTop(
  animValue: Animated.Value,
  duration = animation.duration.normal,
  callback?: () => void
) {
  animValue.setValue(-100);
  return Animated.timing(animValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start(callback);
}

// スライドイン（下から）
export function slideInFromBottom(
  animValue: Animated.Value,
  duration = animation.duration.normal,
  callback?: () => void
) {
  animValue.setValue(100);
  return Animated.timing(animValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start(callback);
}

// スライドイン（右から）
export function slideInFromRight(
  animValue: Animated.Value,
  duration = animation.duration.normal,
  callback?: () => void
) {
  animValue.setValue(100);
  return Animated.timing(animValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start(callback);
}

// シェイク（エラー時）
export function shake(
  animValue: Animated.Value,
  callback?: () => void
) {
  return Animated.sequence([
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
    Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
    Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
    Animated.timing(animValue, { toValue: 0, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
  ]).start(callback);
}

// パルス（注目を引く）
export function pulse(
  animValue: Animated.Value,
  callback?: () => void
) {
  return Animated.sequence([
    Animated.timing(animValue, { toValue: 1.1, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }),
    Animated.timing(animValue, { toValue: 1, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }),
  ]).start(callback);
}

// 触覚フィードバック
export const haptics = {
  light: () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium: () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  heavy: () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  success: () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning: () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  error: () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  selection: () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  },
};

// アニメーション付きプレス用のフック
import { useRef, useCallback } from "react";

export function usePressAnimation(scale = 0.97) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    pressScale(scaleAnim, true, scale);
    haptics.light();
  }, [scaleAnim, scale]);

  const onPressOut = useCallback(() => {
    pressScale(scaleAnim, false);
  }, [scaleAnim]);

  return {
    scaleAnim,
    onPressIn,
    onPressOut,
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
    },
  };
}

// フェードアニメーション用のフック
export function useFadeAnimation(initialValue = 0) {
  const fadeAnim = useRef(new Animated.Value(initialValue)).current;

  const fadeInAnim = useCallback((callback?: () => void) => {
    fadeIn(fadeAnim, animation.duration.normal, callback);
  }, [fadeAnim]);

  const fadeOutAnim = useCallback((callback?: () => void) => {
    fadeOut(fadeAnim, animation.duration.normal, callback);
  }, [fadeAnim]);

  return {
    fadeAnim,
    fadeIn: fadeInAnim,
    fadeOut: fadeOutAnim,
    animatedStyle: {
      opacity: fadeAnim,
    },
  };
}
