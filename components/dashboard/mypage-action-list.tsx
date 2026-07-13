import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { navigate } from "@/lib/navigation";
import { useMySignal } from "@/hooks/use-my-signal";
import { MypageUpcomingEventsSection } from "@/components/mypage/mypage-upcoming-events-section";
import { color, palette } from "@/theme/tokens";

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  tone = "default",
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: "default" | "warn" | "accent";
}) {
  const iconColor =
    tone === "warn"
      ? palette.kimitoOrange
      : tone === "accent"
        ? palette.kimitoBlue
        : color.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <MaterialIcons name={icon} size={22} color={iconColor} style={{ marginRight: 12 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionSub}>{subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={color.textMuted} />
    </Pressable>
  );
}

/** 未開封CTA — 統計と同列に見えないよう横長の強調帯にする(docs/investigation/dashboard-redesign-2026-07-14.md Step4) */
function UnopenedCta({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.unopenedCta, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel={`未開封のすれ違い${count}件を開く`}
    >
      <MaterialIcons name="mail" size={22} color={palette.white} style={{ marginRight: 12 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.unopenedCtaTitle}>未開封の封筒 {count}件</Text>
        <Text style={styles.unopenedCtaSub}>封筒を開いて相手を確認</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={palette.white} />
    </Pressable>
  );
}

/** マイページ — 「いまやること」 */
export function MypageActionList() {
  const { data } = useMySignal();

  const hasActions =
    (data?.unopenedCount ?? 0) > 0 ||
    !data?.checkedInToday ||
    (data?.upcomingParticipationCount ?? 0) > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>いまやること</Text>

      {data && data.unopenedCount > 0 ? (
        <UnopenedCta count={data.unopenedCount} onPress={() => navigate.toHome()} />
      ) : null}

      {data && !data.checkedInToday ? (
        <ActionRow
          icon="location-on"
          title="今日のチェックイン"
          subtitle="現在地を記録してすれ違いを探す"
          tone="warn"
          onPress={() => navigate.toCheckinTab()}
        />
      ) : null}

      {!hasActions ? (
        <Text style={styles.emptyHint}>やることはありません。移動を楽しんでね。</Text>
      ) : null}

      <MypageUpcomingEventsSection embedded />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textPrimary,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: color.textPrimary,
  },
  actionSub: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  emptyHint: {
    fontSize: 13,
    color: color.textMuted,
    paddingVertical: 8,
  },
  unopenedCta: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.kimitoOrange,
    marginBottom: 4,
  },
  unopenedCtaTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: palette.white,
  },
  unopenedCtaSub: {
    fontSize: 12,
    color: palette.white + "D9",
    marginTop: 2,
  },
});
