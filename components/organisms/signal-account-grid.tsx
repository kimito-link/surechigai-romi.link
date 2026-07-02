import MaterialIcons from "@/lib/icons/material-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { color, palette } from "@/theme/tokens";

export type SignalAccountItem = {
  id: number;
  partnerId?: number;
  partnerName: string | null;
  partnerUsername?: string | null;
  partnerDisplayName?: string | null;
  partnerProfileImage?: string | null;
  partnerFollowersCount?: number | null;
  partnerTotalEncounters: number;
  tier: number;
  areaName: string | null;
  prefecture: string | null;
  openedByMe: Date | string | null;
};

type SignalAccountGridProps = {
  items: SignalAccountItem[];
  isDesktop?: boolean;
  isFetching?: boolean;
  onPressItem: (item: SignalAccountItem) => void;
  style?: StyleProp<ViewStyle>;
  /** overlay=地図上に重ねる / docked=地図の下に置く（モバイル向け） */
  layout?: "overlay" | "docked";
};

const TIER_GRADE: Record<number, { label: string; color: string }> = {
  5: { label: "A", color: "#F59E0B" },
  4: { label: "B", color: "#3B82F6" },
  3: { label: "C", color: "#00B894" },
  2: { label: "D", color: "#94A3B8" },
  1: { label: "D", color: "#94A3B8" },
};

function formatCount(count?: number | null): string {
  if (typeof count !== "number" || !Number.isFinite(count)) return "-";
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)}万`;
  return count.toLocaleString("ja-JP");
}

function labelFor(item: SignalAccountItem): string {
  return item.areaName || item.prefecture || "すれ違い";
}

function displayNameFor(item: SignalAccountItem): string {
  return item.partnerDisplayName || item.partnerName || item.partnerUsername || "ロミユーザー";
}

function isLikelyHandle(value: string): boolean {
  return /^[A-Za-z0-9_]{1,15}$/.test(value);
}

function usernameFor(item: SignalAccountItem): string {
  const username = (item.partnerUsername || item.partnerName || "").replace(/^@/, "").trim();
  if (username && isLikelyHandle(username)) return `@${username}`;
  return `ID ${item.partnerId ?? item.id}`;
}

function AccountCard({
  item,
  isDesktop,
  onPress,
}: {
  item: SignalAccountItem;
  isDesktop: boolean;
  onPress: () => void;
}) {
  const grade = TIER_GRADE[item.tier] ?? TIER_GRADE[1];
  const count =
    typeof item.partnerFollowersCount === "number"
      ? formatCount(item.partnerFollowersCount)
      : `${formatCount(item.partnerTotalEncounters)}回`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: isDesktop ? "49%" : "100%" },
        !item.openedByMe && styles.cardUnread,
        pressed && { opacity: 0.78, transform: [{ scale: 0.995 }] },
      ]}
    >
      {item.partnerProfileImage ? (
        <Image source={{ uri: item.partnerProfileImage }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="person" size={24} color="#94A3B8" />
        </View>
      )}

      <View style={styles.accountMain}>
        <View style={styles.nameRow}>
          <Text style={styles.accountName} numberOfLines={1}>
            {displayNameFor(item)}
          </Text>
          {!item.openedByMe && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.accountHandle} numberOfLines={1}>
            {usernameFor(item)}
          </Text>
          <Text style={styles.accountCount} numberOfLines={1}>
            {count}
          </Text>
        </View>
      </View>

      <View style={styles.rightMeta}>
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {labelFor(item)}
          </Text>
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: grade.color }]}>
          <Text style={styles.gradeText}>{grade.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function SignalAccountGrid({
  items,
  isDesktop = false,
  isFetching = false,
  onPressItem,
  style,
  layout = "overlay",
}: SignalAccountGridProps) {
  const visibleItems = items.slice(0, isDesktop ? 10 : 5);
  const unreadCount = items.filter((item) => !item.openedByMe).length;
  const isDocked = layout === "docked";

  return (
    <View style={[styles.panel, isDocked && styles.panelDocked, style]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.plusBadge}>
            <MaterialIcons name="add" size={18} color="#047857" />
          </View>
          <Text style={styles.title}>
            新着アカウント{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Text>
        </View>
        <Text style={styles.headerHint}>{isFetching ? "更新中" : "すれちがい順"}</Text>
      </View>

      {visibleItems.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={isDocked ? styles.dockedScroll : undefined}
          contentContainerStyle={styles.listContent}
        >
          <View style={styles.grid}>
            {visibleItems.map((item) => (
              <AccountCard
                key={item.id}
                item={item}
                isDesktop={isDesktop}
                onPress={() => onPressItem(item)}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="travel-explore" size={28} color="#94A3B8" />
          <Text style={styles.emptyTitle}>まだ新着アカウントはありません</Text>
          <Text style={styles.emptyText}>チェックインすると、近くにいた人がここに並びます</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.95)",
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
    overflow: "hidden",
  },
  panelDocked: {
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  dockedScroll: {
    maxHeight: 320,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
  },
  headerHint: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FBFF",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  accountMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  accountName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    flexShrink: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: color.accentIndigo,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  accountHandle: {
    color: "#64748B",
    fontSize: 11,
    flexShrink: 1,
  },
  accountCount: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  rightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
    maxWidth: "42%",
  },
  categoryChip: {
    maxWidth: 96,
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  gradeBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
});
