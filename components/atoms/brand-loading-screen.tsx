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
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { color, palette } from "@/theme/tokens";

const APP_LOGO = require("@/assets/images/logos/kimitolink-logo.webp");
const LINK_CHARACTER = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

/** #romi-boot-veil と同じブランド背景（manifest.background_color / ヘッダー地と統一）。 */
const BOOT_BACKGROUND = palette.kimitoBlueSoft;

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
  message = "読み込み中…",
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
      <Text style={styles.title}>君斗りんくのすれ違ひ通信</Text>
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
