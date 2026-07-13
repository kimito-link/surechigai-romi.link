import { Pressable, StyleSheet, Text } from "react-native";
import { useMySignal } from "@/hooks/use-my-signal";
import { isInitialQueryLoad } from "@/lib/authenticated-query-options";
import { navigate } from "@/lib/navigation";
import { color } from "@/theme/tokens";

function statValue(n: number | undefined, initial: boolean): string {
  if (typeof n === "number") return String(n);
  return initial ? "—" : "0";
}

/**
 * マイページ — 活動サマリー。
 * 旧2×2統計グリッドを廃止し1行コンパクト表示に(docs/investigation/
 * dashboard-redesign-2026-07-14.md Step4)。未開封はMypageActionListの
 * 強調CTAへ移設済みのためここには含めない(累積成果=足あと/すれ違い/
 * 都道府県のみを扱う)。行全体タップで図鑑へ。
 */
export function MySignalSummary() {
  const { data, isLoading } = useMySignal();
  const initial = isInitialQueryLoad(isLoading, data);

  return (
    <Pressable
      onPress={() => navigate.toZukanTab()}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel="活動サマリーを図鑑で見る"
    >
      <Text style={styles.heading}>活動サマリー</Text>
      <Text style={styles.summaryLine} numberOfLines={1}>
        足あと {statValue(data?.trailCount, initial)} ・ すれ違い{" "}
        {statValue(data?.encounterPartnerCount, initial)}人 ・{" "}
        {statValue(data?.visitedPrefectureCount, initial)}都道府県
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
    gap: 4,
  },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textMuted,
  },
  summaryLine: {
    fontSize: 14,
    fontWeight: "700",
    color: color.textPrimary,
  },
});
