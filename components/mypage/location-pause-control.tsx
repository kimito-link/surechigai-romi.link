/**
 * 足あとの一時停止コントロール（docs/uiux-brushup-SPEC.md §6.3）
 *
 * 3択チップ（1時間/今日中/手動で再開するまで）。選択で即時反映、確認モーダル不要
 * （可逆な操作のため）。停止中はピルで常時可視化する。
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { color, spacing, borderRadius } from "@/theme/tokens";

const OPTIONS = [
  { label: "1時間", hours: 1 },
  { label: "今日中", hours: 24 },
  { label: "手動で再開するまで", hours: 72 },
] as const;

type LocationPauseControlProps = {
  isPausing: boolean;
  pausedUntilLabel: string | null;
  isBusy: boolean;
  onPause: (hours: number) => void;
  onResume: () => void;
};

export function LocationPauseControl({
  isPausing,
  pausedUntilLabel,
  isBusy,
  onPause,
  onResume,
}: LocationPauseControlProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>足あとの一時停止</Text>
      <Text style={styles.subtitle}>停止中はチェックインできません</Text>

      {isPausing ? (
        <View style={styles.pausedRow}>
          <View style={styles.pausedPill}>
            <Text style={styles.pausedPillText}>
              足あとを一時停止中{pausedUntilLabel ? ` — ${pausedUntilLabel}に再開` : ""}
            </Text>
          </View>
          <Pressable
            onPress={onResume}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.resumeButton,
              pressed && !isBusy && { opacity: 0.75 },
              isBusy && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.resumeButtonText}>今すぐ再開</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.chipRow}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.hours}
              onPress={() => onPause(opt.hours)}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.chip,
                pressed && !isBusy && { opacity: 0.75 },
                isBusy && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.chipText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  title: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  chipText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  pausedRow: {
    gap: spacing.sm,
  },
  pausedPill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: color.accentOrange + "55",
    backgroundColor: color.accentOrange + "12",
  },
  pausedPillText: {
    color: color.accentOrange,
    fontSize: 12,
    fontWeight: "700",
  },
  resumeButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: color.accentIndigo,
  },
  resumeButtonText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
});
