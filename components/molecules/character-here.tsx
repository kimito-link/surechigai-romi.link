/**
 * 日本地図上の現在地ピン。
 * 吹き出し・アバター名・空状態テキストを重ねない。ピン1つと、都道府県/市区町村の短いラベル1つだけ。
 */
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";
import { color, palette } from "@/theme/tokens";
import { mapPinLabel } from "@/lib/public-place-label";

type Props = {
  source?: number;
  imageUrl?: string | null;
  name: string;
  place?: string;
  x: number;
  y: number;
  delay?: number;
  isSelf?: boolean;
  /**
   * false のとき地面パルスの無限ループを回さず静止表示にする。
   * 認証済みホームで同時に動くマーカー数を絞り、無限ループ蓄積による OOM を防ぐ。
   */
  animate?: boolean;
};

export function CharacterHere({
  source,
  imageUrl,
  name,
  place,
  x,
  y,
  isSelf,
  animate = true,
}: Props) {
  const float = useSharedValue(0);
  const pulse = useSharedValue(0.8);
  const reduceMotion = useReducedMotion();
  const label = mapPinLabel({ place, name, isSelf });
  const a11yName = /\d+\.\d+/.test(name) ? "ユーザー" : name;
  const accessibilityLabel = isSelf
    ? `自分のピン、${label}`
    : `${a11yName}のピン、${label}`;

  useEffect(() => {
    if (!animate || reduceMotion) {
      float.value = 0;
      pulse.value = 0.5;
      return;
    }

    float.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(float);
      cancelAnimation(pulse);
    };
  }, [float, pulse, animate, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -3 }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (1 - pulse.value) * 0.45 }],
    opacity: 0.35 + pulse.value * 0.25,
  }));

  return (
    <View
      style={[styles.container, { left: `${x}%`, top: `${y}%` }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={floatStyle}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.markerArea}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <View style={styles.iconRing}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.icon} contentFit="cover" />
            ) : source ? (
              <Image source={source} style={styles.icon} contentFit="contain" />
            ) : (
              <View style={styles.iconFallback}>
                <Text style={styles.iconFallbackText}>{a11yName.slice(0, 1)}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.labelChip}>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 112,
    marginLeft: -56,
    marginTop: -18,
    alignItems: "center",
    zIndex: 12,
    pointerEvents: "none",
  },
  markerArea: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.accentPrimary,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.kimitoBlue,
    borderWidth: 2,
    borderColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: {
    width: 32,
    height: 32,
  },
  iconFallback: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.kimitoBlue,
  },
  iconFallbackText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
  },
  labelChip: {
    marginTop: 4,
    maxWidth: 104,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: palette.gray900,
  },
  labelText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
});
