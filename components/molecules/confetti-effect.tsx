import { useEffect, useState } from "react";
import { View, StyleSheet, AccessibilityInfo } from "react-native";
import { color, palette } from "@/theme/tokens";
import { ConfettiParticle } from "@/components/atoms/confetti-particle";

// モジュールスコープで事前計算済みのパーティクル設定
// 実行時の乱数呼び出しを排除し、見た目のバリエーションは決め打ち値で確保
const PARTICLE_COUNT = 20;
const PARTICLE_COLORS = [
  color.accentPrimary,
  color.orange500,
  palette.amber400,
  color.success,
  color.info,
  color.accentAlt,
];

const CONFETTI_PARTICLE_CONFIG = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: ((i * 7 + 3) % 101) - 50,           // -50〜50 の決め打ちパターン
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  delay: i * 30,
  rotationDir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
}));

interface ConfettiEffectProps {
  visible: boolean;
  onComplete?: () => void;
}

/**
 * 簡易的なお祝いエフェクト（紙吹雪のみ）
 * reduceMotion 有効時はアニメーションせず null を返す
 */
export function ConfettiEffect({ visible, onComplete }: ConfettiEffectProps) {
  const [active, setActive] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // reduceMotion の購読
  useEffect(() => {
    let mounted = true;
    const update = (enabled: boolean) => {
      if (mounted) setReduceMotion(enabled);
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
      const _ai = AccessibilityInfo as unknown as { removeEventListener?: (event: string, handler: (v: boolean) => void) => void };
      if (!subscription && typeof _ai.removeEventListener === "function") {
        _ai.removeEventListener("reduceMotionChanged", update);
      }
    };
  }, []);

  useEffect(() => {
    if (visible && !reduceMotion) {
      setActive(true);
      const timeout = setTimeout(() => {
        setActive(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timeout);
    } else if (!visible) {
      setActive(false);
    }
  }, [visible, reduceMotion, onComplete]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {CONFETTI_PARTICLE_CONFIG.map((p) => (
        <ConfettiParticle
          key={p.id}
          x={p.x}
          color={p.color}
          delay={p.delay}
          rotationDir={p.rotationDir}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 100,
    zIndex: 999,
  },
});
