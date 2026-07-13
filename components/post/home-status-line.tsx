/**
 * ホームのステータスライン（docs/uiux-brushup-SPEC.md §5.2）
 *
 * 「今日、足あとを残したか」を可視化する。地図は足さない(ホームには既に
 * JapanRadarMapがあり、OOM予算(docs/auth-home-oom-diagnosis-v2.md)と衝突する
 * ため)。場所名+時刻+精度ピルのテキスト強化版に留める
 * (docs/investigation/dashboard-redesign-2026-07-14.md Step3)。
 * 新規アニメ0本・新規常時DOM要素はテキスト2〜3行のみ（地雷2の予算に影響しない）。
 */

import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, spacing, borderRadius } from "@/theme/tokens";
import { formatDateTime } from "@/components/organisms/precision-tile-map";

type HomeStatusLineProps = {
  checkedInToday: boolean;
  latestPlaceLabel: string | null;
  latestRecordedAt: Date | string | null;
  accuracyM?: number | null;
  isPausing?: boolean;
  pausedUntilLabel?: string | null;
};

function formatAccuracy(accuracyM: number | null | undefined): string | null {
  if (accuracyM == null || !Number.isFinite(accuracyM)) return null;
  return `±${Math.round(accuracyM)}m`;
}

export function HomeStatusLine({
  checkedInToday,
  latestPlaceLabel,
  latestRecordedAt,
  accuracyM,
  isPausing = false,
  pausedUntilLabel,
}: HomeStatusLineProps) {
  const accuracyLabel = formatAccuracy(accuracyM);

  return (
    <View style={styles.wrap}>
      {checkedInToday && latestRecordedAt ? (
        <>
          <Text style={styles.placeText} numberOfLines={1}>
            {latestPlaceLabel ?? "記録済み"}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {formatDateTime(latestRecordedAt)}
            {accuracyLabel ? ` · ${accuracyLabel}` : ""}
          </Text>
        </>
      ) : (
        <Text style={styles.text} numberOfLines={1}>
          今日はまだ足あとがありません
        </Text>
      )}

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
  placeText: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  metaText: {
    color: color.textMuted,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
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
