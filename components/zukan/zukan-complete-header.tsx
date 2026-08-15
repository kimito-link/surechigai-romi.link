/**
 * 図鑑コンプリートヘッダー（docs/uiux-brushup-SPEC.md §4.2）
 *
 * 「{n} / 47 都道府県」を大きく見せ、達成の全体感を1画面の最上部で伝える。
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { navigate } from "@/lib/navigation";
import { color, spacing, borderRadius } from "@/theme/tokens";

const TOTAL_PREFECTURES = 47;

type ZukanCompleteHeaderProps = {
  visitedPrefectureCount: number;
  municipalityCount: number;
  encounterPartnerCount: number;
  /**
   * 図鑑タブ内のセクションへスクロールする。
   *
   * ★以前は navigate.toZukanTab() を呼んでいたが、このヘッダーは図鑑タブの中にあるため
   *   押しても何も起きなかった（2026-08-15 修正）。未指定なら押せないまま出す。
   */
  onScrollToEncounterOrigins?: () => void;
  /** 訪問セクションへスクロール（未指定なら押せない） */
  onScrollToVisited?: () => void;
};

export function ZukanCompleteHeader({
  visitedPrefectureCount,
  municipalityCount,
  encounterPartnerCount,
  onScrollToEncounterOrigins,
  onScrollToVisited,
}: ZukanCompleteHeaderProps) {
  const progress = Math.min(1, visitedPrefectureCount / TOTAL_PREFECTURES);

  return (
    <View style={styles.wrap}>
      {onScrollToVisited ? (
        <Pressable
          onPress={onScrollToVisited}
          accessibilityRole="button"
          accessibilityLabel="訪問した都道府県を見る"
          style={({ pressed }) => [styles.heroRow, pressed && styles.pressed]}
        >
          <Text style={styles.heroNumber}>{visitedPrefectureCount}</Text>
          <Text style={styles.heroTotal}>{" "}/ {TOTAL_PREFECTURES} 都道府県</Text>
        </Pressable>
      ) : (
        <View style={styles.heroRow}>
          <Text style={styles.heroNumber}>{visitedPrefectureCount}</Text>
          <Text style={styles.heroTotal}>{" "}/ {TOTAL_PREFECTURES} 都道府県</Text>
        </View>
      )}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.summaryRow}>
        <Pressable
          onPress={() => navigate.toMapTab()}
          accessibilityRole="button"
          accessibilityLabel="訪問した市区町村を地図で見る"
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.summaryLine}>{municipalityCount} 市区町村</Text>
        </Pressable>
        <Text style={styles.summarySep}>·</Text>
        {onScrollToEncounterOrigins ? (
          <Pressable
            onPress={onScrollToEncounterOrigins}
            accessibilityRole="button"
            accessibilityLabel="すれ違い人数を見る"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.summaryLine}>すれ違い {encounterPartnerCount} 人</Text>
          </Pressable>
        ) : (
          <Text style={styles.summaryLine}>すれ違い {encounterPartnerCount} 人</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "flex-start",
  },
  pressed: {
    opacity: 0.82,
  },
  heroNumber: {
    color: color.accentPrimary,
    fontSize: 30,
    fontWeight: "800",
  },
  heroTotal: {
    color: color.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: color.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.sm,
    backgroundColor: color.accentPrimary,
  },
  summaryLine: {
    color: color.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  summarySep: {
    color: color.textMuted,
    fontSize: 13,
  },
});
