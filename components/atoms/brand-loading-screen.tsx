/**
 * ブランド読み込み画面（ロゴ＋ゆっくりりんく）。
 *
 * ★2026-08-16: 共有リンクから来た人が最初に見るのがスピナー1個＋小さな文字だけで、
 * 「ロゴだけでゆっくりりんくのキャラが入っていない、そして小さい」状態だった。
 * 起動直後はブランドを伝える唯一の場面なので、
 * - ファーストビューを使い切る（flex:1 で画面いっぱい）
 * - ロゴとキャラを大きく出す（画面幅に追従。狭い端末でも潰れないよう clamp 相当で挟む）
 * を満たす共通コンポーネントにして、読み込み画面がある所は全部これに寄せる。
 *
 * Web の初回ブートベール（app/+html.tsx の #romi-boot-veil）と
 * 背景色・キャラ・配置を揃えてあるので、ベール解除後にここへ繋がっても絵が飛ばない。
 */
import { View, Text, StyleSheet, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { color, palette } from "@/theme/tokens";
import { BOOT } from "@/theme/tokens/boot";

const APP_LOGO = require("@/assets/images/logos/kimitolink-logo.webp");
const LINK_CHARACTER = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

/** #romi-boot-veil と同じブランド背景（値の正本は theme/tokens/boot.ts の BOOT.background）。 */
const BOOT_BACKGROUND = BOOT.background;

const DEFAULT_MESSAGE = "読み込み中…";

/* ★2026-10-12 Web のフルスクリーン待機は、ブートベール（app/+html.tsx の #romi-boot-veil）と
   **同じ絵・同じ位置**にする。Android 実機の起動録画で、ベール解除の直後に
   「アイコンの無い文字だけの画面 → ロゴ＋ゆっくりりんく（ベールとは別の絵）」と
   切り替わり、絵と位置が飛んでいた。
   マーク・大きさ・間隔・タイトルは **すべて theme/tokens/boot.ts の BOOT から取る**（ここに直書きしない。
   ベールと食い違うと切り替わりで絵が飛ぶ。__tests__/boot-single-source.test.ts が固定）。
   マークはベールが preload 済み＝同じ URL なのでキャッシュが効く。
   style の calc/clamp は react-native-web が CSS にそのまま通す（型は数値のみなので as never）。 */
const WEB_MARK_SIZE = BOOT.markSize;
const WEB_MARK_SOURCE = { uri: BOOT.markSrc };

interface BrandLoadingScreenProps {
  /** 読み込み中に出す一言。省略時は「読み込み中…」 */
  message?: string;
  /**
   * 画面いっぱいに広げるか。既定は true（ファーストビューを使い切る）。
   * 画面の一部として差し込む場合だけ false にする。
   */
  fullscreen?: boolean;
}

export function BrandLoadingScreen({
  message = DEFAULT_MESSAGE,
  fullscreen = true,
}: BrandLoadingScreenProps) {
  const { width, height } = useWindowDimensions();

  /* ★2026-08-16: useWindowDimensions が初回に 0 を返すことがあり、
     min() に 0 が混ざって width/height が 0px になり、
     **ロゴもキャラも描画されない**状態になっていた（本番実測で判明。
     img は complete=true なのに rect が 0x0）。
     0 のときは画面基準の計算をやめ、既定値で描く。 */
  const hasViewport = width > 0 && height > 0;

  /* キャラは画面幅の 46%。狭い端末で潰れず、大画面で巨大になりすぎない範囲に挟む。
     さらに縦が短い端末（横向き等）では高さ基準でも抑え、はみ出しを防ぐ。 */
  const charaSize = hasViewport
    ? Math.min(Math.max(width * 0.46, 150), 320, height * 0.38)
    : 200;
  /* ロゴはキャラより控えめ。上に置いて「何のアプリか」を先に伝える。
     素材は 800x600（縦横比 0.75）なので、幅を出しすぎると縦を食う。 */
  const logoWidth = hasViewport
    ? Math.min(Math.max(width * 0.34, 120), 240, height * 0.18)
    : 150;

  if (Platform.OS === "web" && fullscreen) {
    return (
      <View
        style={[
          styles.webRoot,
          hasViewport ? { minHeight: Math.max(height - 124, 320) } : null,
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel={message}
      >
        <Image
          source={WEB_MARK_SOURCE}
          style={[styles.webMark, { width: WEB_MARK_SIZE, height: WEB_MARK_SIZE } as never]}
          contentFit="contain"
          transition={0}
          accessibilityLabel=""
        />
        <View style={styles.webMeta}>
          <Text style={styles.webTitle}>{BOOT.title}</Text>
          <ActivityIndicator size={28} color={palette.kimitoBlue} />
          {message !== DEFAULT_MESSAGE ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        fullscreen && styles.fullscreen,
        /* 親が高さを渡さない構成でも画面を埋めるための下支え。
           ヘッダー(約56)とタブバー(約68)を引いた分を最低高さにする。 */
        fullscreen && hasViewport ? { minHeight: Math.max(height - 124, 320) } : null,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <Image
        source={APP_LOGO}
        style={{ width: logoWidth, height: logoWidth * 0.75 }}
        contentFit="contain"
        /* 読み込み画面自体が遅延すると本末転倒なので、フェードを入れず即出しする。 */
        transition={0}
      />
      <Image
        source={LINK_CHARACTER}
        style={{ width: charaSize, height: charaSize }}
        contentFit="contain"
        transition={0}
        accessibilityLabel=""
      />
      <Text style={styles.title}>{BOOT.title}</Text>
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={palette.kimitoBlue} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BOOT_BACKGROUND,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  /* ファーストビューを使い切る。
     ★2026-08-16: flex:1 だけだと、親が高さを渡さない構成のときに
     中身の高さまでしか広がらず「ファーストビューいっぱいにならない」状態になる。
     alignSelf:stretch で横も必ず広げ、最低高さはコンポーネント側で
     ビューポートから算出して渡す（ヘッダー・タブバーがあるので 100dvh は使わない）。 */
  fullscreen: {
    flex: 1,
    alignSelf: "stretch",
  },
  /* Web 専用レイアウト（ベールと同じ絵・位置）。マークは中央に固定し、タイトル+スピナーはその下の別枠。 */
  webRoot: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    position: "relative",
    backgroundColor: BOOT_BACKGROUND,
  },
  webMark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
  } as never,
  webMeta: {
    position: "absolute",
    left: 0,
    right: 0,
    top: `calc(50% + ${WEB_MARK_SIZE} / 2 + ${BOOT.metaGap})`,
    alignItems: "center",
    gap: 24,
  } as never,
  webTitle: {
    color: BOOT.titleColor,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  title: {
    color: palette.kimitoBlue,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  message: {
    color: color.textMuted,
    fontSize: 14,
  },
});

export default BrandLoadingScreen;
