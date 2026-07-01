/**
 * ブランドコピー「会いたい君がいる現在地」
 * 君斗りんくのすれ違ひ通信の感情の核（DESIGN.md）。全ページとログアウト時に
 * バランスよく差し込むための共通コンポーネント。
 *
 * - compact: ヘッダー下やモーダルなどに収める 1〜2 行の小さめ表記
 * - 「現在地」を kimitoOrange で強調し、正確な場所を残す価値と結びつける
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
        accessibilityLabel="会いたい君がいる現在地"
      >
        会いたい君がいる
        <Text style={[styles.compactAccent, onDark && styles.compactAccentOnDark]}>現在地</Text>
      </Text>
    );
  }

  return (
    <View
      style={{ alignItems: align === "center" ? "center" : "flex-start" }}
      accessibilityLabel="会いたい君がいる現在地"
    >
      <Text style={[styles.line1, onDark && styles.line1OnDark, lcpProminent && styles.line1Lcp]}>
        会いたい君がいる
      </Text>
      <Text style={[styles.line2, onDark && styles.line2OnDark, lcpProminent && styles.line2Lcp]}>現在地</Text>
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
    color: palette.kimitoOrange,
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
