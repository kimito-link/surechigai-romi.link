import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { useRouter } from "expo-router";
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

/** マイページ — 「いまやること」 */
export function MypageActionList() {
  const router = useRouter();
  const { data } = useMySignal();

  const hasActions =
    (data?.unopenedCount ?? 0) > 0 ||
    !data?.checkedInToday ||
    (data?.upcomingParticipationCount ?? 0) > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>いまやること</Text>

      {data && data.unopenedCount > 0 ? (
        <ActionRow
          icon="mail"
          title={`未開封のすれ違い ${data.unopenedCount} 件`}
          subtitle="封筒を開いて相手を確認"
          tone="accent"
          onPress={() => router.push("/(tabs)")}
        />
      ) : null}

      {data && !data.checkedInToday ? (
        <ActionRow
          icon="location-on"
          title="今日のチェックイン"
          subtitle="現在地を記録してすれ違いを探す"
          tone="warn"
          onPress={() => router.push("/(tabs)/checkin")}
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
    borderRadius: 16,
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
});
