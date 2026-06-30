/**
 * マイページ — 参加表明中の集まり + リマインド切替
 */
import { View, Text, Pressable, StyleSheet, Switch, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { formatEventDateTime } from "@/components/events/events-event-card";
import {
  getEventReminderPermissionStatus,
  requestEventReminderPermission,
  REMINDER_OFFSETS_MINUTES,
} from "@/lib/event-reminders";
import { useCallback, useMemo, useState } from "react";

function formatCountdown(startAt: string | Date): string {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  const diffMs = start.getTime() - Date.now();
  if (diffMs <= 0) return "開始済み／ライブ中";
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `あと${days}日`;
  if (hours >= 1) return `あと${hours}時間`;
  const mins = Math.floor(diffMs / (60 * 1000));
  return `あと${mins}分`;
}

function placeLabel(item: {
  locationType: string;
  eventPrefecture: string | null;
  venueName: string | null;
}): string {
  if (item.locationType === "online") return "オンライン";
  return [item.eventPrefecture, item.venueName].filter(Boolean).join(" ") || "場所未設定";
}

export function MypageUpcomingEventsSection() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [permHint, setPermHint] = useState<string | null>(null);

  const { data: items, isLoading } = trpc.eventParticipation.myUpcoming.useQuery(undefined, {
    staleTime: 30_000,
  });

  const setReminderMut = trpc.eventParticipation.setReminder.useMutation({
    onSuccess: () => {
      void utils.eventParticipation.myUpcoming.invalidate();
    },
  });

  const reminderHint = useMemo(() => {
    const hours = REMINDER_OFFSETS_MINUTES.map((m) =>
      m >= 24 * 60 ? "1日前" : m >= 60 ? "1時間前" : "15分前",
    );
    return hours.join("・");
  }, []);

  const handleToggleReminder = useCallback(
    async (eventId: number, next: boolean) => {
      if (next) {
        const ok = await requestEventReminderPermission();
        if (!ok) {
          const status = getEventReminderPermissionStatus();
          setPermHint(
            status === "denied"
              ? "ブラウザの設定で通知を許可するとリマインドが届きます"
              : "通知が許可されなかったため、リマインドを設定できません",
          );
          return;
        }
        setPermHint(null);
      }
      setReminderMut.mutate({ eventId, enabled: next });
    },
    [setReminderMut],
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>参加表明中の集まり</Text>
        <ActivityIndicator color={color.accentPrimary} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (!items?.length) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>参加表明中の集まり</Text>
        <Text style={styles.emptyText}>
          まだ参加表明した集まりはありません。{"\n"}
          「集まり」タブから予定を選んで参加表明できます。
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/events")}
          style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="calendar-today" size={18} color={palette.kimitoBlue} />
          <Text style={styles.linkBtnText}>集まりを見る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>参加表明中の集まり</Text>
        <Text style={styles.sectionBadge}>{items.length}件</Text>
      </View>
      <Text style={styles.hint}>
        リマインドは {reminderHint} に通知（{Platform.OS === "web" ? "ブラウザ通知" : "端末通知"}）
      </Text>
      {permHint ? <Text style={styles.permHint}>{permHint}</Text> : null}

      <View style={styles.list}>
        {items.map((item) => {
          const isLive = item.status === "live";
          return (
            <View key={item.participationId} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.creatorRow}>
                    {item.creatorProfileImage ? (
                      <Image
                        source={{ uri: item.creatorProfileImage }}
                        style={styles.creatorAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.creatorAvatar, styles.creatorFallback]}>
                        <MaterialIcons name="person" size={12} color={color.textMuted} />
                      </View>
                    )}
                    <Text style={styles.creatorName} numberOfLines={1}>
                      {item.creatorName ?? "主催者"}
                    </Text>
                  </View>
                </View>
                {isLive ? (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>ライブ</Text>
                  </View>
                ) : (
                  <Text style={styles.countdown}>{formatCountdown(item.startAt)}</Text>
                )}
              </View>

              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={14} color={color.textMuted} />
                <Text style={styles.metaText}>{formatEventDateTime(item.startAt)}</Text>
                <MaterialIcons name="place" size={14} color={color.textMuted} style={{ marginLeft: 8 }} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {placeLabel(item)}
                </Text>
              </View>

              {item.message ? (
                <Text style={styles.message} numberOfLines={2}>
                  「{item.message}」
                </Text>
              ) : null}

              <View style={styles.reminderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderLabel}>開始リマインド</Text>
                  <Text style={styles.reminderSub}>{item.reminderEnabled ? "ON — 通知予定" : "OFF"}</Text>
                </View>
                <Switch
                  value={item.reminderEnabled}
                  onValueChange={(v) => void handleToggleReminder(item.eventId, v)}
                  disabled={setReminderMut.isPending}
                  trackColor={{ false: palette.gray400, true: palette.kimitoOrange }}
                  thumbColor={palette.white}
                />
              </View>

              <Pressable
                onPress={() => router.push("/(tabs)/events")}
                style={({ pressed }) => [styles.detailLink, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.detailLinkText}>集まりタブで詳細を見る</Text>
                <MaterialIcons name="chevron-right" size={18} color={color.accentIndigo} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: color.textPrimary,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlue + "14",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: color.textMuted,
    lineHeight: 18,
  },
  permHint: {
    marginTop: 6,
    fontSize: 12,
    color: color.warning,
    lineHeight: 18,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: color.textMuted,
    lineHeight: 20,
  },
  linkBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "44",
    backgroundColor: palette.kimitoBlue + "0A",
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.kimitoBlue,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: color.textPrimary,
    lineHeight: 21,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  creatorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  creatorFallback: {
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: "600",
    color: color.textSecondary,
    flexShrink: 1,
  },
  countdown: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.kimitoOrange,
    flexShrink: 0,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: color.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.textWhite,
  },
  liveText: {
    color: color.textWhite,
    fontSize: 10,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: color.textMuted,
    flexShrink: 1,
  },
  message: {
    fontSize: 12,
    color: color.textSecondary,
    fontStyle: "italic",
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  reminderLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textPrimary,
  },
  reminderSub: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  detailLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: color.accentIndigo,
  },
});
