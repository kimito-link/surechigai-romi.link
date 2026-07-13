import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@/lib/icons/material-icons";
import { useMySignal } from "@/hooks/use-my-signal";
import { formatEventDateTime } from "@/components/events/events-event-card";
import { EventParticipantsModal } from "@/components/events/event-participants-modal";
import { navigate } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";
import { useState } from "react";

function AvatarStack({
  avatars,
  count,
  onPress,
}: {
  avatars: (string | null)[];
  count: number;
  onPress?: () => void;
}) {
  const shown = avatars.slice(0, 5);
  const inner = (
    <View style={styles.avatarRow}>
      <View style={styles.avatarStack}>
        {shown.map((uri, i) => (
          <View
            key={`${uri ?? "none"}-${i}`}
            style={[styles.stackWrap, { marginLeft: i === 0 ? 0 : -8 }]}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.stackAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.stackAvatar, styles.stackFallback]}>
                <MaterialIcons name="person" size={12} color={color.textMuted} />
              </View>
            )}
          </View>
        ))}
      </View>
      <Text style={styles.participantText}>{count}人</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
        accessibilityRole="button"
        accessibilityLabel={`参加者${count}人を見る`}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

/** 主催中の集まり — 参加者アバター + 人数 */
export function HostEventsSummary() {
  const { data } = useMySignal();
  const [modalEventId, setModalEventId] = useState<number | null>(null);
  const [modalTitle, setModalTitle] = useState("");

  const events = data?.hostEvents ?? [];
  if (events.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>主催中の集まり</Text>
      {events.map((ev) => (
        <Pressable
          key={ev.id}
          onPress={() => navigate.toEventDetail(ev.id)}
          style={({ pressed }) => [styles.eventRow, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={`${ev.title}の詳細を見る`}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {ev.title}
            </Text>
            <Text style={styles.eventMeta}>
              {formatEventDateTime(ev.startAt)} · {ev.status === "live" ? "ライブ中" : "予定"}
            </Text>
          </View>
          <AvatarStack
            avatars={ev.participantAvatars}
            count={ev.participantCount}
            onPress={() => {
              setModalEventId(ev.id);
              setModalTitle(ev.title);
            }}
          />
          <MaterialIcons name="chevron-right" size={20} color={color.textMuted} />
        </Pressable>
      ))}

      {modalEventId != null ? (
        <EventParticipantsModal
          visible
          eventId={modalEventId}
          eventTitle={modalTitle}
          onClose={() => setModalEventId(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: color.border,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textPrimary,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: color.textPrimary,
  },
  eventMeta: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackWrap: {
    borderWidth: 2,
    borderColor: color.surface,
    borderRadius: 14,
  },
  stackAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stackFallback: {
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  participantText: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.kimitoBlue,
  },
});
