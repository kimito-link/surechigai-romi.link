/**
 * 起動中だけ出す、ネイティブのスプラッシュと同じ絵。
 *
 * ワードマーク・地図ピン・ゆっくり・タグラインは1枚の画像（BOOT.splashSrc /
 * assets/images/splash-composition.png）に焼いてある。ここでロゴとスピナーを
 * 別に組むと、切り替わりのたびに絵が飛ぶ。
 *
 * 起動が終わったあとの待ち（タブの遅延読み込みなど）は、同じ絵を再表示しない。
 * 地色だけの面にする。文言つきの途中読み込み（軌跡など）もスピナー付きの全面スプラッシュにしない。
 */
import { View, Text, StyleSheet, Platform, useWindowDimensions, Image } from "react-native";
import { BOOT } from "@/theme/tokens/boot";
import { palette } from "@/theme/tokens/palette";
import { isBootVeilReleased } from "@/lib/boot-veil";
import { splashArtSize } from "@/lib/splash-art-size";

const ART = require("@/assets/images/splash-composition.png");
const BOOT_BACKGROUND = BOOT.background;

const DEFAULT_MESSAGE = "読み込み中…";

export { splashArtSize };

interface BrandLoadingScreenProps {
  /** 読み込み中に出す一言。省略時は起動画面と同じ絵（文言は画像の中）。 */
  message?: string;
  /** 画面いっぱいに広げるか。既定は true。 */
  fullscreen?: boolean;
}

export function BrandLoadingScreen({
  message = DEFAULT_MESSAGE,
  fullscreen = true,
}: BrandLoadingScreenProps) {
  const { width, height } = useWindowDimensions();
  const art = splashArtSize(width, height);

  if (message !== DEFAULT_MESSAGE) {
    return (
      <View style={styles.quiet} accessibilityRole="progressbar" accessibilityLabel={message}>
        <Text style={styles.quietText}>{message}</Text>
      </View>
    );
  }

  /* 起動が終わったあとに同じ絵を出すと、画面遷移のたびにスプラッシュがもう一度見える。 */
  if (isBootVeilReleased()) {
    return <View style={[styles.fill, fullscreen && styles.fullscreen]} />;
  }

  if (Platform.OS === "web" && fullscreen) {
    return (
      <View
        style={[styles.webRoot, fullscreen && styles.fullscreen]}
        accessibilityRole="progressbar"
        accessibilityLabel={BOOT.tagline}
      >
        {/* expo-image はデコードが1フレーム遅れ、ベールと同じ絵が一度消える。CSS の背景にする。 */}
        <View
          style={
            [
              styles.webArt,
              {
                width: BOOT.artWidth,
                aspectRatio: BOOT.artWidthPx / BOOT.artHeightPx,
                backgroundImage: `url("${BOOT.splashSrc}")`,
              },
            ] as never
          }
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.fill, styles.center, fullscreen && styles.fullscreen]}
      accessibilityRole="progressbar"
      accessibilityLabel={BOOT.tagline}
    >
      <Image
        source={ART}
        style={{ width: art.width, height: art.height }}
        resizeMode="contain"
        fadeDuration={0}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: BOOT_BACKGROUND,
  },
  fullscreen: {
    flex: 1,
    alignSelf: "stretch",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  webRoot: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    backgroundColor: BOOT_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  webArt: {
    maxWidth: "100%",
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  } as never,
  quiet: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: palette.kimitoBg,
  },
  quietText: {
    color: BOOT.titleColor,
    fontSize: 15,
    fontWeight: "700",
  },
});

export default BrandLoadingScreen;
