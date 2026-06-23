/**
 * 夜空の背景演出（トップ＝日本地図レーダーの背面）。
 * 星空・富士山のシルエット・流れ星で「会いたい君がいる現在地」の世界観を出す。
 * レーダー/封筒の視認性を落とさないよう、控えめ・低コントラストに保つ。
 * Web/native 両対応（react-native の Animated と View/Svg のみ使用）。
 */
import { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Platform } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

// 星の固定配置（id ベースの擬似ランダム。Math.random は使わず描画を安定させる）。
const STARS = Array.from({ length: 48 }, (_, i) => ({
  left: (Math.sin(i * 12.9898) * 0.5 + 0.5) * 100,
  top: (Math.cos(i * 78.233) * 0.5 + 0.5) * 62, // 上 62% に散らす（富士の上）
  size: 1 + ((i * 7) % 3),
  dim: 0.35 + ((i * 13) % 50) / 100,
}));

function ShootingStar({ delay, topPct, durationMs }: { delay: number; topPct: number; durationMs: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.delay(2600),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: Platform.OS !== "web" }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay, durationMs]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.9, 0.7, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shootingStar,
        { top: `${topPct}%`, opacity, transform: [{ translateX }, { translateY }, { rotate: "28deg" }] },
      ]}
    />
  );
}

export function NightSkyBackdrop() {
  const stars = useMemo(() => STARS, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 夜空グラデ（上＝濃紺、下＝地図の宇宙色に馴染ませる） */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#040714" />
            <Stop offset="0.55" stopColor="#0a1428" />
            <Stop offset="1" stopColor="#020817" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nightSky)" />
      </Svg>

      {/* 星 */}
      {stars.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: "#FFFFFF",
            opacity: s.dim,
          }}
        />
      ))}

      {/* 流れ星（数本・時間差） */}
      <ShootingStar delay={600} topPct={12} durationMs={900} />
      <ShootingStar delay={3200} topPct={26} durationMs={1100} />
      <ShootingStar delay={5200} topPct={8} durationMs={800} />

      {/* 富士山のシルエット（最下部・夜のシルエット） */}
      <Svg
        style={styles.fuji}
        width="100%"
        height="34%"
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax slice"
      >
        <Path d="M0 220 L0 150 Q420 28 560 24 Q700 28 1120 150 L1200 160 L1200 220 Z" fill="#0a1626" />
        {/* 冠雪 */}
        <Path d="M500 64 Q560 22 560 24 Q560 22 620 64 Q596 54 580 66 Q566 50 552 66 Q536 54 500 64 Z" fill="#26405e" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shootingStar: {
    position: "absolute",
    left: "8%",
    width: 70,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#cfe3ff",
    // テール風の淡い影
    shadowColor: "#cfe3ff",
    shadowOffset: { width: -8, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  fuji: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
