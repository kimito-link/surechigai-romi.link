import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@/lib/icons/material-icons";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";

type Props = {
  visible: boolean;
  eventId: number;
  eventTitle: string;
  onClose: () => void;
};

/** 主催者向け — 参加表明者一覧モーダル */
export function EventParticipantsModal({ visible, eventId, eventTitle, onClose }: Props) {
  const { data, isLoading } = trpc.eventParticipation.listByEvent.useQuery(
    { eventId },
    { enabled: visible },
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              参加表明 — {eventTitle}
            </Text>
            <Pressable onPress={onClose} accessibilityLabel="閉じる" hitSlop={8}>
              <MaterialIcons name="close" size={22} color={color.textMuted} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.kimitoBlue} />
            </View>
          ) : !data?.length ? (
            <Text style={styles.empty}>まだ参加表明はありません</Text>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 16 }}>
              {data.map((p) => (
                <View key={p.id} style={styles.row}>
                  {p.profileImage ? (
                    <Image source={{ uri: p.profileImage }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <MaterialIcons name="person" size={20} color={color.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {p.displayName ?? "ユーザー"}
                    </Text>
                    {p.message ? (
                      <Text style={styles.message} numberOfLines={2}>
                        {p.message}
                      </Text>
                    ) : null}
                    {p.prefecture ? (
                      <Text style={styles.meta}>{p.prefecture}</Text>
                    ) : null}
                  </View>
                  {p.username ? (
                    <Pressable
                      onPress={() => Linking.openURL(`https://x.com/${p.username}`)}
                      style={({ pressed }) => [styles.xBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={styles.xBtnText}>𝕏</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "99",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: color.surface,
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: color.textPrimary,
  },
  loading: {
    padding: 32,
    alignItems: "center",
  },
  empty: {
    padding: 24,
    textAlign: "center",
    color: color.textMuted,
    fontSize: 14,
  },
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: color.textPrimary,
  },
  message: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  xBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.black,
  },
  xBtnText: {
    color: palette.white,
    fontWeight: "800",
    fontSize: 13,
  },
});
