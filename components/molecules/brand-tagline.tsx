/**
 * ブランドコピー「現在地でつながる／すれ違ひ通信」
 * 君斗りんくのすれ違ひ通信の感情の核（DESIGN.md）。全ページとログアウト時に
 * バランスよく差し込むための共通コンポーネント。
 *
 * - compact: ヘッダー下やモーダルなどに収める 1〜2 行の小さめ表記
 * - 「現在地」を kimitoOrange で強調し、正確な場所を残す価値と結びつける
 *
 * ★2026-09-11 変更: 旧「会いたい君がいる現在地」から差し替え。
 *   旧コピーは特定作品の世界観を連想させうるという判断（法的な問題ではない）。
 *   「すれ違ひ」は旧仮名（アプリ名と揃える）。「すれ違い」と書かないこと。
 */
import { Text, View, StyleSheet, type TextStyle } from "react-native";
import { palette } from "@/theme/tokens";

interface BrandTaglineProps {
  /** 1 行のスリム表記（ヘッダー・フッター向け）。false で 2 行の大きめ表記 */
  compact?: boolean;
  align?: "left" | "center";
  /** 濃色ヒーロー向け（guest トップ LCP） */
  variant?: "default" | "heroDark";
  /** ゲストホーム LCP 向け — 「現在地」を大きく */
  lcpProminent?: boolean;
  /** 文字色のトーン: light=濃いネイビー(淡色地向け) */
  style?: TextStyle;
}

export function BrandTagline({
  compact = true,
  align = "center",
  variant = "default",
  lcpProminent = false,
  style,
}: BrandTaglineProps) {
  const onDark = variant === "heroDark";

  if (compact) {
    return (
      <Text
        style={[styles.compact, onDark && styles.compactOnDark, { textAlign: align }, style]}
        numberOfLines={1}
        accessibilityLabel="キミの現在地を刻む"
      >
        キミの
        <Text style={[styles.compactAccent, onDark && styles.compactAccentOnDark]}>現在地</Text>
        を、刻む。
      </Text>
    );
  }

  return (
    <View
      style={{ alignItems: align === "center" ? "center" : "flex-start" }}
      accessibilityLabel="キミの現在地を刻む"
    >
      <Text style={[styles.line1, onDark && styles.line1OnDark, lcpProminent && styles.line1Lcp]}>
        キミの
      </Text>
      <Text style={[styles.line2, onDark && styles.line2OnDark, lcpProminent && styles.line2Lcp]}>
        現在地
      </Text>
      <Text style={[styles.line1, onDark && styles.line1OnDark]}>
        を、刻む。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  compactAccent: {
    // 12px の小さい文字。ブランド色 #DD6500 だとカード地で 2.98 と AA 未達のため
    // 文字用の濃い派生色を使う（面・アイコンには kimitoOrange のまま）。
    color: palette.kimitoOrangeText,
    fontWeight: "800",
  },
  line1: {
    color: palette.kimitoBlue,
    fontSize: 16,
    fontWeight: "700",
  },
  line2: {
    color: palette.kimitoOrange,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  compactOnDark: {
    color: "#FFFFFF",
  },
  compactAccentOnDark: {
    color: palette.kimitoOrange,
  },
  line1OnDark: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 18,
  },
  line2OnDark: {
    color: palette.kimitoOrange,
    fontSize: 32,
    fontWeight: "900",
  },
  line1Lcp: {
    fontSize: 20,
    fontWeight: "800",
  },
  line2Lcp: {
    fontSize: 36,
    fontWeight: "900",
    marginTop: 4,
  },
});
