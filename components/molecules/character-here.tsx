/**
 * 日本地図上に「キャラがここにいるよ」を吹き出しで示すマーカー。
 * アイコン＋吹き出し（"ここにいるよ"）＋名前。x/y（%）で地図上に絶対配置する
 * （EnvelopePulse と同じ配置方式）。淡いパルスで存在感を出す。
 */
import { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { color } from "@/theme/tokens";

type Props = {
  source: number; // require(...) した画像
  name: string;
  place?: string; // 居場所の地名（例: 小樽）。あれば「○○にいるよ」と表示
  x: number; // 地図上の横位置（%）
  y: number; // 地図上の縦位置（%）
  delay?: number;
};

export function CharacterHere({ source, name, place, x, y, delay = 0 }: Props) {
  const float = useSharedValue(0);
  const pulse = useSharedValue(0.8);

  useEffect(() => {
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
  }, [float, pulse]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -4 }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (1 - pulse.value) * 1.6 }],
    opacity: pulse.value * 0.5,
  }));

  return (
    <View style={[styles.container, { left: `${x}%`, top: `${y}%` }]}>
      {/* 吹き出し */}
      <Animated.View style={[styles.bubbleWrap, floatStyle]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{place ? `${place}にいるよ` : "ここにいるよ"}</Text>
        </View>
        <View style={styles.bubbleTail} />
      </Animated.View>

      {/* 地面のパルス（現在地マーカー） */}
      <View style={styles.markerArea}>
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        {/* キャラアイコン */}
        <View style={styles.iconRing}>
          <Image source={source} style={styles.icon} contentFit="contain" />
        </View>
        <Text style={styles.name}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 96,
    marginLeft: -48,
    marginTop: -64,
    alignItems: "center",
    zIndex: 12,
    pointerEvents: "none",
  },
  bubbleWrap: {
    alignItems: "center",
    marginBottom: 2,
  },
  bubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: color.accentPrimary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bubbleText: {
    color: "#1a2540",
    fontSize: 11,
    fontWeight: "700",
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    marginTop: -1,
  },
  markerArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.accentPrimary,
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(13,17,23,0.85)",
    borderWidth: 2,
    borderColor: color.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: {
    width: 40,
    height: 40,
  },
  name: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
