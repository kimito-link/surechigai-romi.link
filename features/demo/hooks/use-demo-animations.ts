/**
 * use-demo-animations Hook
 * デモ画面のアニメーション SharedValue・スタイル管理
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  type SharedValue,
  type AnimatedStyle,
} from "react-native-reanimated";
import type { ViewStyle, TextStyle } from "react-native";

export interface DemoAnimations {
  progressWidth: SharedValue<number>;
  buttonScale: SharedValue<number>;
  celebrationOpacity: SharedValue<number>;
  numberScale: SharedValue<number>;
  progressAnimatedStyle: AnimatedStyle<ViewStyle>;
  buttonAnimatedStyle: AnimatedStyle<ViewStyle>;
  celebrationAnimatedStyle: AnimatedStyle<ViewStyle>;
  numberAnimatedStyle: AnimatedStyle<TextStyle>;
  animateProgress: (progressPercent: number, duration?: number) => void;
  animateJoin: (progressPercent: number) => void;
  animateContribution: (progressPercent: number) => void;
  resetProgress: () => void;
}

export function useDemoAnimations(): DemoAnimations {
  const progressWidth = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const celebrationOpacity = useSharedValue(0);
  const numberScale = useSharedValue(1);

  const progressAnimatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    width: `${progressWidth.value}%` as `${number}%`,
  }));

  const buttonAnimatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const celebrationAnimatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: celebrationOpacity.value,
  }));

  const numberAnimatedStyle = useAnimatedStyle<TextStyle>(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const animateProgress = (progressPercent: number, duration = 1000) => {
    progressWidth.value = withTiming(progressPercent, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  };

  const animateJoin = (progressPercent: number) => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    numberScale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withSpring(1, { damping: 8 })
    );
    progressWidth.value = withTiming(progressPercent, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    celebrationOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2000, withTiming(0, { duration: 500 }))
    );
  };

  const animateContribution = (progressPercent: number) => {
    numberScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withSpring(1, { damping: 10 })
    );
    progressWidth.value = withTiming(progressPercent, { duration: 500 });
  };

  const resetProgress = () => {
    progressWidth.value = 0;
  };

  return {
    progressWidth,
    buttonScale,
    celebrationOpacity,
    numberScale,
    progressAnimatedStyle,
    buttonAnimatedStyle,
    celebrationAnimatedStyle,
    numberAnimatedStyle,
    animateProgress,
    animateJoin,
    animateContribution,
    resetProgress,
  };
}
