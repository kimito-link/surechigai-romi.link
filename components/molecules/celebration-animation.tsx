import { useEffect, useState, useMemo, useCallback } from "react";
import { color, palette } from "@/theme/tokens";
import { View, StyleSheet, Platform } from "react-native";
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
  SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// キャラクター画像
const CHARACTER_HAPPY = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

interface CelebrationAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  characterSize?: number;
  showConfetti?: boolean;
}

// 紙吹雪アイテムの型
interface ConfettiItemValues {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
}

// 紙吹雪アイテムコンポーネント（Hooksをトップレベルで呼び出す）
function ConfettiItem({
  index,
  item,
}: {
  index: number;
  item: ConfettiItemValues;
}) {
  const confettiStyle = useAnimatedStyle(() => ({
    opacity: item.opacity.value,
    transform: [
      { translateX: item.x.value },
      { translateY: item.y.value },
      { rotate: `${item.rotation.value}deg` },
      { scale: item.scale.value },
    ],
  }));

  const confettiColors = [color.accentPrimary, color.orange500, palette.amber400, color.success, color.info, color.accentAlt];
  const confettiColor = confettiColors[index % confettiColors.length];

  return (
    <Animated.View
      style={[
        styles.confetti,
        confettiStyle,
        { backgroundColor: confettiColor },
      ]}
    />
  );
}

/**
 * 成功時のお祝いアニメーションコンポーネント
 * キャラクターがジャンプして喜ぶアニメーション + 紙吹雪
 */
export function CelebrationAnimation({
  visible,
  onComplete,
  characterSize = 120,
  showConfetti = true,
}: CelebrationAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // キャラクターアニメーション値
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  // 紙吹雪のアニメーション値（固定数でトップレベルで定義）
  const confetti0x = useSharedValue(0);
  const confetti0y = useSharedValue(0);
  const confetti0rotation = useSharedValue(0);
  const confetti0opacity = useSharedValue(0);
  const confetti0scale = useSharedValue(1);
  
  const confetti1x = useSharedValue(0);
  const confetti1y = useSharedValue(0);
  const confetti1rotation = useSharedValue(0);
  const confetti1opacity = useSharedValue(0);
  const confetti1scale = useSharedValue(1);
  
  const confetti2x = useSharedValue(0);
  const confetti2y = useSharedValue(0);
  const confetti2rotation = useSharedValue(0);
  const confetti2opacity = useSharedValue(0);
  const confetti2scale = useSharedValue(1);
  
  const confetti3x = useSharedValue(0);
  const confetti3y = useSharedValue(0);
  const confetti3rotation = useSharedValue(0);
  const confetti3opacity = useSharedValue(0);
  const confetti3scale = useSharedValue(1);
  
  const confetti4x = useSharedValue(0);
  const confetti4y = useSharedValue(0);
  const confetti4rotation = useSharedValue(0);
  const confetti4opacity = useSharedValue(0);
  const confetti4scale = useSharedValue(1);
  
  const confetti5x = useSharedValue(0);
  const confetti5y = useSharedValue(0);
  const confetti5rotation = useSharedValue(0);
  const confetti5opacity = useSharedValue(0);
  const confetti5scale = useSharedValue(1);
  
  const confetti6x = useSharedValue(0);
  const confetti6y = useSharedValue(0);
  const confetti6rotation = useSharedValue(0);
  const confetti6opacity = useSharedValue(0);
  const confetti6scale = useSharedValue(1);
  
  const confetti7x = useSharedValue(0);
  const confetti7y = useSharedValue(0);
  const confetti7rotation = useSharedValue(0);
  const confetti7opacity = useSharedValue(0);
  const confetti7scale = useSharedValue(1);
  
  const confetti8x = useSharedValue(0);
  const confetti8y = useSharedValue(0);
  const confetti8rotation = useSharedValue(0);
  const confetti8opacity = useSharedValue(0);
  const confetti8scale = useSharedValue(1);
  
  const confetti9x = useSharedValue(0);
  const confetti9y = useSharedValue(0);
  const confetti9rotation = useSharedValue(0);
  const confetti9opacity = useSharedValue(0);
  const confetti9scale = useSharedValue(1);
  
  const confetti10x = useSharedValue(0);
  const confetti10y = useSharedValue(0);
  const confetti10rotation = useSharedValue(0);
  const confetti10opacity = useSharedValue(0);
  const confetti10scale = useSharedValue(1);
  
  const confetti11x = useSharedValue(0);
  const confetti11y = useSharedValue(0);
  const confetti11rotation = useSharedValue(0);
  const confetti11opacity = useSharedValue(0);
  const confetti11scale = useSharedValue(1);

  // 紙吹雪アイテムの配列をuseMemoで作成
  const confettiItems: ConfettiItemValues[] = useMemo(() => [
    { x: confetti0x, y: confetti0y, rotation: confetti0rotation, opacity: confetti0opacity, scale: confetti0scale },
    { x: confetti1x, y: confetti1y, rotation: confetti1rotation, opacity: confetti1opacity, scale: confetti1scale },
    { x: confetti2x, y: confetti2y, rotation: confetti2rotation, opacity: confetti2opacity, scale: confetti2scale },
    { x: confetti3x, y: confetti3y, rotation: confetti3rotation, opacity: confetti3opacity, scale: confetti3scale },
    { x: confetti4x, y: confetti4y, rotation: confetti4rotation, opacity: confetti4opacity, scale: confetti4scale },
    { x: confetti5x, y: confetti5y, rotation: confetti5rotation, opacity: confetti5opacity, scale: confetti5scale },
    { x: confetti6x, y: confetti6y, rotation: confetti6rotation, opacity: confetti6opacity, scale: confetti6scale },
    { x: confetti7x, y: confetti7y, rotation: confetti7rotation, opacity: confetti7opacity, scale: confetti7scale },
    { x: confetti8x, y: confetti8y, rotation: confetti8rotation, opacity: confetti8opacity, scale: confetti8scale },
    { x: confetti9x, y: confetti9y, rotation: confetti9rotation, opacity: confetti9opacity, scale: confetti9scale },
    { x: confetti10x, y: confetti10y, rotation: confetti10rotation, opacity: confetti10opacity, scale: confetti10scale },
    { x: confetti11x, y: confetti11y, rotation: confetti11rotation, opacity: confetti11opacity, scale: confetti11scale },
  ], [
    confetti0x, confetti0y, confetti0rotation, confetti0opacity, confetti0scale,
    confetti1x, confetti1y, confetti1rotation, confetti1opacity, confetti1scale,
    confetti2x, confetti2y, confetti2rotation, confetti2opacity, confetti2scale,
    confetti3x, confetti3y, confetti3rotation, confetti3opacity, confetti3scale,
    confetti4x, confetti4y, confetti4rotation, confetti4opacity, confetti4scale,
    confetti5x, confetti5y, confetti5rotation, confetti5opacity, confetti5scale,
    confetti6x, confetti6y, confetti6rotation, confetti6opacity, confetti6scale,
    confetti7x, confetti7y, confetti7rotation, confetti7opacity, confetti7scale,
    confetti8x, confetti8y, confetti8rotation, confetti8opacity, confetti8scale,
    confetti9x, confetti9y, confetti9rotation, confetti9opacity, confetti9scale,
    confetti10x, confetti10y, confetti10rotation, confetti10opacity, confetti10scale,
    confetti11x, confetti11y, confetti11rotation, confetti11opacity, confetti11scale,
  ]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleComplete = useCallback(() => {
    setIsAnimating(false);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (visible && !isAnimating) {
      setIsAnimating(true);
      
      // ハプティクスフィードバック
      triggerHaptic();

      // キャラクターの登場アニメーション
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );

      // ジャンプアニメーション（3回）
      translateY.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(-30, { duration: 200, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
          ),
          3,
          false
        )
      );

      // 軽い回転
      rotate.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 100 }),
            withTiming(5, { duration: 100 }),
            withTiming(0, { duration: 100 })
          ),
          3,
          false
        )
      );

      // 紙吹雪アニメーション
      if (showConfetti) {
        confettiItems.forEach((item, index) => {
          const delay = index * 50;
          const angle = (index / confettiItems.length) * Math.PI * 2;
          const distance = 100 + Math.random() * 50;
          
          item.opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
          item.x.value = withDelay(
            delay,
            withTiming(Math.cos(angle) * distance, { duration: 800, easing: Easing.out(Easing.quad) })
          );
          item.y.value = withDelay(
            delay,
            withSequence(
              withTiming(-50 - Math.random() * 30, { duration: 400, easing: Easing.out(Easing.quad) }),
              withTiming(100 + Math.random() * 50, { duration: 600, easing: Easing.in(Easing.quad) })
            )
          );
          item.rotation.value = withDelay(
            delay,
            withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1000 })
          );
          item.opacity.value = withDelay(
            delay + 700,
            withTiming(0, { duration: 300 })
          );
        });
      }

      // アニメーション完了後のコールバック
      const timeout = setTimeout(() => {
        runOnJS(handleComplete)();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [visible, isAnimating, confettiItems, handleComplete, opacity, rotate, scale, showConfetti, translateY, triggerHaptic]);

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
      {/* 紙吹雪 */}
      {showConfetti && confettiItems.map((item, index) => (
        <ConfettiItem key={index} index={index} item={item} />
      ))}

      {/* キャラクター */}
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

/**
 * 簡易的なお祝いエフェクト（紙吹雪のみ）
 */
export function ConfettiEffect({
  visible,
  onComplete,
}: {
  visible: boolean;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<{
    id: number;
    x: number;
    color: string;
    delay: number;
  }[]>([]);

  useEffect(() => {
    if (visible) {
      const colors = [color.accentPrimary, color.orange500, palette.amber400, color.success, color.info, color.accentAlt];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        color: colors[i % colors.length],
        delay: i * 30,
      }));
      setParticles(newParticles);

      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [visible, onComplete]);

  if (!visible || particles.length === 0) return null;

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} {...particle} />
      ))}
    </View>
  );
}

function ConfettiParticle({
  x,
  color: particleColor,
  delay,
}: {
  x: number;
  color: string;
  delay: number;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const particleOpacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withDelay(delay, withTiming(x, { duration: 1000 }));
    translateY.value = withDelay(
      delay,
      withTiming(200, { duration: 1000, easing: Easing.in(Easing.quad) })
    );
    rotation.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1000 })
    );
    particleOpacity.value = withDelay(delay + 700, withTiming(0, { duration: 300 }));
  }, [delay, particleOpacity, rotation, translateX, translateY, x]);

  const style = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        style,
        { backgroundColor: particleColor },
      ]}
    />
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
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 100,
    zIndex: 999,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
