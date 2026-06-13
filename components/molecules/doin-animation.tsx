import { useEffect, useState, useCallback } from "react";
import { color, palette } from "@/theme/tokens";
import { View, StyleSheet, Platform, AccessibilityInfo } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useConfettiItems, CONFETTI_COUNT } from "./use-confetti-items";
import type { ConfettiItemValues } from "./use-confetti-items";

const CHARACTER_HAPPY = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

interface DoinAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  characterSize?: number;
  showConfetti?: boolean;
}

// 紙吹雪の軌跡を事前計算（実行時の乱数呼び出しを排除）
const _COLORS = [color.accentPrimary, color.orange500, palette.amber400, color.success, color.info, color.accentAlt];
const CONFETTI_CONFIG = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
  const ang  = (i / CONFETTI_COUNT) * Math.PI * 2;
  const dist = 100 + ((i * 17 + 5) % 51);
  return {
    delay:       i * 50,
    cosX:        Math.cos(ang) * dist,
    peakY:      -(50 + ((i * 13 + 7) % 31)),
    landY:       100 + ((i * 11 + 3) % 51),
    rotationEnd: 360 * (i % 2 === 0 ? 1 : -1),
    color:       _COLORS[i % _COLORS.length],
  };
});

// 紙吹雪1粒のアニメーション付きビュー
function ConfettiItem({ index, item }: { index: number; item: ConfettiItemValues }) {
  const animStyle = useAnimatedStyle(() => ({
    opacity: item.opacity.value,
    transform: [
      { translateX: item.x.value },
      { translateY: item.y.value },
      { rotate: `${item.rotation.value}deg` },
      { scale: item.scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[styles.confetti, animStyle, { backgroundColor: CONFETTI_CONFIG[index].color }]}
    />
  );
}

/**
 * 成功時のお祝いアニメーションコンポーネント
 * キャラクターがジャンプして喜ぶアニメーション + 紙吹雪
 */
export function DoinAnimation({
  visible,
  onComplete,
  characterSize = 120,
  showConfetti = true,
}: DoinAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const scale     = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate    = useSharedValue(0);
  const opacity   = useSharedValue(0);

  const confettiItems = useConfettiItems();

  // reduceMotion の購読
  useEffect(() => {
    let mounted = true;
    const update = (enabled: boolean) => {
      if (mounted) setPrefersReducedMotion(enabled);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => update(false));

    const subscription =
      typeof AccessibilityInfo.addEventListener === "function"
        ? AccessibilityInfo.addEventListener("reduceMotionChanged", update)
        : null;

    return () => {
      mounted = false;
      subscription?.remove?.();
      if (!subscription && typeof (AccessibilityInfo as unknown as { removeEventListener?: unknown }).removeEventListener === "function") {
        (AccessibilityInfo as unknown as { removeEventListener: (event: string, handler: (v: boolean) => void) => void })
          .removeEventListener("reduceMotionChanged", update);
      }
    };
  }, []);

  const resetConfetti = useCallback(() => {
    confettiItems.forEach((item) => {
      item.opacity.value = 0;
      item.x.value = 0;
      item.y.value = 0;
      item.rotation.value = 0;
      item.scale.value = 1;
    });
  }, [confettiItems]);

  useEffect(() => {
    if (!visible) resetConfetti();
  }, [visible, resetConfetti]);

  const handleComplete = useCallback(() => {
    setIsAnimating(false);
    AccessibilityInfo.announceForAccessibility("達成！おめでとうございます。");
    onComplete?.();
  }, [onComplete]);

  const enableConfetti = showConfetti && !prefersReducedMotion;

  useEffect(() => {
    if (!visible || isAnimating) return;

    setIsAnimating(true);

    if (Platform.OS !== "web" && !prefersReducedMotion) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1,   { damping: 10, stiffness: 150 })
    );
    translateY.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(0,   { duration: 200, easing: Easing.in(Easing.quad) })
        ),
        3,
        false
      )
    );
    rotate.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5,  { duration: 100 }),
          withTiming(0,  { duration: 100 })
        ),
        3,
        false
      )
    );

    if (enableConfetti) {
      confettiItems.forEach((item, i) => {
        const cfg = CONFETTI_CONFIG[i];
        item.opacity.value = withDelay(cfg.delay, withTiming(1, { duration: 100 }));
        item.x.value = withDelay(
          cfg.delay,
          withTiming(cfg.cosX, { duration: 800, easing: Easing.out(Easing.quad) })
        );
        item.y.value = withDelay(
          cfg.delay,
          withSequence(
            withTiming(cfg.peakY, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(cfg.landY, { duration: 600, easing: Easing.in(Easing.quad) })
          )
        );
        item.rotation.value = withDelay(
          cfg.delay,
          withTiming(cfg.rotationEnd, { duration: 1000 })
        );
        item.opacity.value = withDelay(cfg.delay + 700, withTiming(0, { duration: 300 }));
      });
    }

    const timeout = setTimeout(() => runOnJS(handleComplete)(), 2000);
    return () => clearTimeout(timeout);
  }, [visible, isAnimating, confettiItems, enableConfetti, handleComplete, opacity, prefersReducedMotion, rotate, scale, translateY]);

  const characterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (!visible && !isAnimating) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {enableConfetti && confettiItems.map((item, index) => (
        <ConfettiItem key={index} index={index} item={item} />
      ))}
      <Animated.View style={[styles.characterContainer, characterStyle]}>
        <Image
          source={CHARACTER_HAPPY}
          style={{ width: characterSize, height: characterSize }}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  characterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
