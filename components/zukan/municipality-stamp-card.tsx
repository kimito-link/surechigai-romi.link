/**
 * 市区町村カード＝「切手」（docs/uiux-brushup-SPEC.md §4.3）
 *
 * 図鑑を単なる履歴一覧でなく「集めていく」体験にする。装飾でなくデータで差をつける
 * — 初訪問日・訪問回数。希少性タグ(P2)はサーバー集計コストを検証してから追加する。
 */

import { Pressable, Text, StyleSheet } from "react-native";
import { color, borderRadius, spacing } from "@/theme/tokens";

type MunicipalityStampCardProps = {
  municipality: string;
  prefecture: string | null;
  visitCount: number;
  firstVisitedAt: Date | string;
  onPress?: () => void;
};

function formatFirstVisit(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");
}

export function MunicipalityStampCard({
  municipality,
  prefecture,
  visitCount,
  firstVisitedAt,
  onPress,
}: MunicipalityStampCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && { opacity: 0.8 }]}
      accessibilityLabel={`${municipality}の足あとを地図で見る`}
    >
      <Text style={styles.headerRow} numberOfLines={1}>
        <Text style={styles.municipality}>{municipality}</Text>
        {prefecture && prefecture !== municipality ? (
          <Text style={styles.prefecture}>  {prefecture}</Text>
        ) : null}
      </Text>
      <Text style={styles.firstVisit}>初 {formatFirstVisit(firstVisitedAt)}</Text>
      <Text style={styles.visitCount}>足あと {visitCount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: spacing.sm,
    gap: 2,
  },
  headerRow: {
    flexDirection: "row",
  },
  municipality: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  prefecture: {
    color: color.textMuted,
    fontSize: 12,
  },
  firstVisit: {
    color: color.textMuted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  visitCount: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
