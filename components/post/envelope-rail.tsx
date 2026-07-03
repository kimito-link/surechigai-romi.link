/**
 * 未開封封筒の横レール（docs/uiux-brushup-SPEC.md §5.2/5.5）
 *
 * ホーム最上部の「開けに戻ってくる」導線。上限5件（超過分はテキストで集約）。
 * 新規の無限アニメは追加しない（静的カード + NEW バッジのみ。地雷2の予算を増やさない）。
 */

import { View, Text, FlatList, Pressable, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import { color, palette, spacing, borderRadius } from "@/theme/tokens";
import {
  type EncounterItem,
  TIER_COLORS,
  TIER_LABELS,
  formatEncounterDate,
} from "@/lib/post/encounter-shared";

const RAIL_LIMIT = 5;

type EnvelopeRailProps = {
  items: EncounterItem[];
  onOpen: (item: EncounterItem) => void;
};

function EnvelopeRailCard({ item, onOpen }: { item: EncounterItem; onOpen: (item: EncounterItem) => void }) {
  const tierColor = TIER_COLORS[item.tier] || color.accentPrimary;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onOpen(item);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityLabel={`${item.areaName || item.prefecture || "不明なエリア"}のすれちがいを開封`}
    >
      <View style={[styles.iconWrap, { borderColor: tierColor + "66" }]}>
        <MaterialIcons name="mail" size={22} color={tierColor} />
      </View>
      <Text style={styles.area} numberOfLines={1}>
        {item.areaName || item.prefecture || "不明なエリア"}
      </Text>
      <Text style={styles.date} numberOfLines={1}>
        {formatEncounterDate(item.occurredAt)}
      </Text>
      <View style={styles.newBadge}>
        <Text style={styles.newBadgeText}>NEW</Text>
      </View>
    </Pressable>
  );
}

export function EnvelopeRail({ items, onOpen }: EnvelopeRailProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>すれちがいを待っています</Text>
      </View>
    );
  }

  const shown = items.slice(0, RAIL_LIMIT);
  const hiddenCount = items.length - shown.length;

  return (
    <View style={styles.wrap}>
      <Text style={styles.headline}>新しいすれちがいが{items.length}通</Text>
      <FlatList
        data={shown}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.railContent}
        renderItem={({ item }) => <EnvelopeRailCard item={item} onOpen={onOpen} />}
        ListFooterComponent={
          hiddenCount > 0 ? (
            <View style={styles.moreCard}>
              <Text style={styles.moreCardText}>ほか{hiddenCount}通</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  headline: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: spacing.lg,
  },
  railContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    width: 132,
    marginRight: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    gap: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  area: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  date: {
    color: color.textMuted,
    fontSize: 11,
  },
  newBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: color.textWhite,
    fontSize: 9,
    fontWeight: "800",
  },
  moreCard: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  moreCardText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 13,
  },
});
