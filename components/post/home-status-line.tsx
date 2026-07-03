/**
 * ホームのステータスライン（docs/uiux-brushup-SPEC.md §5.2）
 *
 * 「今日、足あとを残したか」を1行で可視化する。新規アニメ0本・新規常時DOM要素は
 * テキスト1〜2行のみ（地雷2の予算に影響しない）。
 */

import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, spacing, borderRadius } from "@/theme/tokens";
import { formatDateTime } from "@/components/organisms/precision-tile-map";

type HomeStatusLineProps = {
  checkedInToday: boolean;
  latestPlaceLabel: string | null;
  latestRecordedAt: Date | string | null;
  isPausing?: boolean;
  pausedUntilLabel?: string | null;
};

export function HomeStatusLine({
  checkedInToday,
  latestPlaceLabel,
  latestRecordedAt,
  isPausing = false,
  pausedUntilLabel,
}: HomeStatusLineProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text} numberOfLines={1}>
        {checkedInToday && latestRecordedAt
          ? `今日の足あと: ${latestPlaceLabel ?? "記録済み"} ${formatDateTime(latestRecordedAt)}`
          : "今日はまだ足あとがありません"}
      </Text>

      {isPausing ? (
        <View style={styles.pausedPill}>
          <MaterialIcons name="pause-circle-filled" size={14} color={color.accentOrange} />
          <Text style={styles.pausedPillText}>
            足あとを一時停止中{pausedUntilLabel ? ` — ${pausedUntilLabel}に再開` : ""}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  text: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  pausedPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: color.accentOrange + "55",
    backgroundColor: color.accentOrange + "12",
  },
  pausedPillText: {
    color: color.accentOrange,
    fontSize: 11,
    fontWeight: "700",
  },
});
