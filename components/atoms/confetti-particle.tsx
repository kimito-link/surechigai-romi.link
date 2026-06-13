import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface ConfettiParticleProps {
  x: number;
  color: string;
  delay: number;
  rotationDir: 1 | -1;
}

/**
 * 紙吹雪の単一パーティクル
 * ConfettiEffect から利用される
 */
export function ConfettiParticle({
  x,
  color: particleColor,
  delay,
  rotationDir,
}: ConfettiParticleProps) {
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
      withTiming(360 * rotationDir, { duration: 1000 })
    );
    particleOpacity.value = withDelay(delay + 700, withTiming(0, { duration: 300 }));
  }, [delay, particleOpacity, rotation, rotationDir, translateX, translateY, x]);

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
      style={[styles.confetti, style, { backgroundColor: particleColor }]}
    />
  );
}

const styles = StyleSheet.create({
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
