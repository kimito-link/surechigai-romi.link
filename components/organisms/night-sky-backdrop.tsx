/**
 * 夜空の背景演出（トップ＝日本地図レーダーの背面）。
 * 星空・富士山のシルエット・流れ星で「会いたい君がいる現在地」の世界観を出す。
 * レーダー/封筒の視認性を落とさないよう、控えめ・低コントラストに保つ。
 * Web/native 両対応（react-native の Animated と View/Svg のみ使用）。
 */
import { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Platform } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Line, Circle, G } from "react-native-svg";

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

      {/* 星座（結線＋星・控えめ）。fujisan-clean のプラネタリウム風に寄せる。 */}
      <Svg style={styles.constellations} viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice">
        {/* 北斗七星風（左上） */}
        <G opacity={0.55}>
          <Line x1="10" y1="14" x2="16" y2="12" stroke="#9fc0e6" strokeWidth="0.3" />
          <Line x1="16" y1="12" x2="22" y2="13" stroke="#9fc0e6" strokeWidth="0.3" />
          <Line x1="22" y1="13" x2="27" y2="17" stroke="#9fc0e6" strokeWidth="0.3" />
          <Line x1="27" y1="17" x2="24" y2="22" stroke="#9fc0e6" strokeWidth="0.3" />
          <Line x1="24" y1="22" x2="18" y2="21" stroke="#9fc0e6" strokeWidth="0.3" />
          <Line x1="18" y1="21" x2="27" y2="17" stroke="#9fc0e6" strokeWidth="0.3" />
          {[[10,14],[16,12],[22,13],[27,17],[24,22],[18,21]].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r="0.7" fill="#eaf3ff" />
          ))}
        </G>
        {/* オリオン座風（右中・三つ星＋肩腰） */}
        <G opacity={0.5}>
          <Line x1="78" y1="20" x2="86" y2="22" stroke="#bcd4f0" strokeWidth="0.3" />
          <Line x1="86" y1="22" x2="82" y2="30" stroke="#bcd4f0" strokeWidth="0.3" />
          <Line x1="82" y1="30" x2="83" y2="31" stroke="#bcd4f0" strokeWidth="0.3" />
          <Line x1="83" y1="31" x2="84" y2="32" stroke="#bcd4f0" strokeWidth="0.3" />
          <Line x1="84" y1="32" x2="80" y2="40" stroke="#bcd4f0" strokeWidth="0.3" />
          <Line x1="80" y1="40" x2="88" y2="38" stroke="#bcd4f0" strokeWidth="0.3" />
          <Line x1="78" y1="20" x2="80" y2="40" stroke="#bcd4f0" strokeWidth="0.3" />
          {[[78,20],[86,22],[82,30],[83,31],[84,32],[80,40],[88,38]].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r="0.7" fill="#eaf3ff" />
          ))}
        </G>
      </Svg>

      {/* 流れ星（数本・時間差） */}
      <ShootingStar delay={600} topPct={12} durationMs={900} />
      <ShootingStar delay={3200} topPct={26} durationMs={1100} />
      <ShootingStar delay={5200} topPct={8} durationMs={800} />

      {/* 富士山のシルエット（最下部・夜のシルエット。地図の手前にうっすら見えるよう明るめ） */}
      <Svg
        style={styles.fuji}
        width="100%"
        height="42%"
        viewBox="0 0 1200 240"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* 裾野の街明かり（夜空のある町感）：地平線に淡いオレンジの帯 */}
        <Rect x="0" y="196" width="1200" height="44" fill="#1a2540" opacity="0.9" />
        <Rect x="0" y="196" width="1200" height="10" fill="#3a4a2a" opacity="0.5" />
        {/* 富士本体 */}
        <Path d="M0 240 L0 168 Q420 44 560 40 Q700 44 1120 168 L1200 178 L1200 240 Z" fill="#1b2c47" />
        {/* 冠雪 */}
        <Path d="M498 82 Q560 38 560 40 Q560 38 622 82 Q596 70 580 84 Q565 66 551 84 Q535 70 498 82 Z" fill="#cdddf0" opacity="0.85" />
      </Svg>
      {/* 街明かり（地平線のともしび。点々と灯る家々） */}
      <View style={styles.townLights} pointerEvents="none">
        {Array.from({ length: 22 }, (_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: `${(i / 22) * 100 + ((i * 7) % 4)}%`,
              bottom: 4 + ((i * 5) % 10),
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: i % 3 === 0 ? "#ffd9a0" : "#ffe9c8",
              opacity: 0.7,
            }}
          />
        ))}
      </View>
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
  constellations: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "55%",
  },
  fuji: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  townLights: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
  },
});
