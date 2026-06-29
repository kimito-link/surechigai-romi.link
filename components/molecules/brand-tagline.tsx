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
  /** 文字色のトーン: light=濃いネイビー(淡色地向け) */
  style?: TextStyle;
}

export function BrandTagline({ compact = true, align = "center", style }: BrandTaglineProps) {
  if (compact) {
    return (
      <Text
        style={[styles.compact, { textAlign: align }, style]}
        numberOfLines={1}
        accessibilityLabel="会いたい君がいる現在地"
      >
        会いたい君がいる
        <Text style={styles.compactAccent}>現在地</Text>
      </Text>
    );
  }

  return (
    <View style={{ alignItems: align === "center" ? "center" : "flex-start" }}>
      <Text style={styles.line1}>会いたい君がいる</Text>
      <Text style={styles.line2}>現在地</Text>
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
});
