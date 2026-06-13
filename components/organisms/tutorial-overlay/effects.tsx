// components/organisms/tutorial-overlay/effects.tsx
// v6.18: チュートリアルのエフェクトコンポーネント
// v6.56: React Hooks rules-of-hooks違反を修正（Hooksをコールバック外に移動）
import { View, Dimensions, StyleSheet, Text } from "react-native";
import { useEffect, useMemo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
} from "react-native-reanimated";
import { color } from "@/theme/tokens";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * 個別の紙吹雪ピース
 */
function ConfettiPiece({ active, index }: { active: boolean; index: number }) {
  const initialX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
  const initialScale = useMemo(() => 0.5 + Math.random() * 0.5, []);
  
  const x = useSharedValue(initialX);
  const y = useSharedValue(-50);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(initialScale);

  useEffect(() => {
    if (active) {
      const delay = Math.random() * 500;
      y.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 50, { duration: 2000 + Math.random() * 1000 }));
      rotation.value = withDelay(delay, withRepeat(withTiming(360, { duration: 1000 }), -1, false));
      x.value = withDelay(delay, withTiming(initialX + (Math.random() - 0.5) * 100, { duration: 2000 }));
    } else {
      // Reset when inactive
      x.value = initialX;
      y.value = -50;
      rotation.value = 0;
    }
  }, [active, initialX, x, y, rotation]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: x.value,
    top: y.value,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const confettiColors = [color.coral, color.confettiTeal, color.confettiYellow, color.confettiMint, color.confettiCoral, color.hostAccentLegacy];
  const pieceColor = confettiColors[index % confettiColors.length];

  return (
    <Animated.View style={style}>
      <View style={{ width: 10, height: 10, backgroundColor: pieceColor, borderRadius: 2 }} />
    </Animated.View>
  );
}

/**
 * 紙吹雪コンポーネント
 */
export function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  if (!active) return null;
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((index) => (
        <ConfettiPiece key={index} active={active} index={index} />
      ))}
    </View>
  );
}

/**
 * 個別のキラキラ
 */
function SparklePiece({ active, index }: { active: boolean; index: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  // Pre-calculate position
  const position = useMemo(() => {
    const angle = (index / 12) * Math.PI * 2;
    const radius = 80 + Math.random() * 40;
    return {
      x: SCREEN_WIDTH / 2 + Math.cos(angle) * radius - 10,
      y: SCREEN_HEIGHT / 2 - 50 + Math.sin(angle) * radius - 10,
    };
  }, [index]);

  useEffect(() => {
    if (active) {
      const delay = index * 50;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      scale.value = withDelay(delay, withTiming(1, { duration: 300 }));
    } else {
      opacity.value = 0;
      scale.value = 0;
    }
  }, [active, index, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    left: position.x,
    top: position.y,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 20, color: color.rankGold }}>✦</Text>
    </Animated.View>
  );
}

/**
 * キラキラエフェクトコンポーネント
 */
export function Sparkles({ active }: { active: boolean }) {
  const sparkleIndices = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  if (!active) return null;
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sparkleIndices.map((index) => (
        <SparklePiece key={index} active={active} index={index} />
      ))}
    </View>
  );
}
