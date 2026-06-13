/**
 * features/profile/components/BadgeGrid.tsx
 * バッジグリッド
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { commonCopy } from "@/constants/copy/common";
import type { Badge } from "@/drizzle/schema/gamification";

interface BadgeGridProps {
  badges: Badge[];
}

export const BadgeGrid = memo(({ badges }: BadgeGridProps) => {
  const colors = useColors();

  if (badges.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="emoji-events" size={48} color={color.textSubtle} />
        <Text style={styles.emptyText}>{commonCopy.empty.noBadges}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {badges.map((badge) => (
        <View key={`${badge.id}-${badge.createdAt}`} style={styles.cell}>
          <View style={[styles.badgeCircle, { backgroundColor: color.hostAccentLegacy }]}>
            <Text style={styles.badgeIcon}>🏆</Text>
          </View>
          <Text style={[styles.badgeName, { color: colors.foreground }]}>{badge.name}</Text>
          <Text style={styles.badgeDate}>
            {new Date(badge.createdAt).toLocaleDateString("ja-JP")}
          </Text>
        </View>
      ))}
    </View>
  );
});

BadgeGrid.displayName = "BadgeGrid";

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: color.textMuted,
    marginTop: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "33.33%",
    padding: 8,
    alignItems: "center",
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  badgeDate: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
});
