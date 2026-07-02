/**
 * 未開封封筒カード（reanimated 非依存 — 初回 bundle から reanimated を外す）。
 */
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import {
  type EncounterItem,
  TIER_COLORS,
  TIER_LABELS,
  formatEncounterDate,
} from "@/lib/post/encounter-shared";
import { color, palette } from "@/theme/tokens";

type EnvelopeCardProps = {
  item: EncounterItem;
  onOpen: (item: EncounterItem) => void;
};

export function EnvelopeCard({ item, onOpen }: EnvelopeCardProps) {
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
      style={({ pressed }) => [styles.envelopeCard, pressed && styles.envelopeCardPressed]}
    >
      <View style={styles.envelopePressable}>
        <View style={[styles.envelopeIconWrap, { borderColor: tierColor + "66" }]}>
          <MaterialIcons name="mail" size={36} color={tierColor} />
          <View style={[styles.envelopeSealDot, { backgroundColor: tierColor }]} />
        </View>
        <View style={styles.envelopeTextWrap}>
          <View style={styles.envelopeRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "22" }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>
                {TIER_LABELS[item.tier] || `Tier ${item.tier}`}
              </Text>
            </View>
            <Text style={styles.envelopeDate} numberOfLines={1}>
              {formatEncounterDate(item.occurredAt)}
            </Text>
          </View>
          <Text style={styles.envelopeArea} numberOfLines={1}>
            {item.areaName || item.prefecture || "不明なエリア"}
          </Text>
          <Text style={styles.envelopeTapHint}>タップして開封</Text>
        </View>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  envelopeCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: color.surface,
    overflow: "hidden",
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  envelopeCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  envelopePressable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  envelopeIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  envelopeSealDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  envelopeTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  envelopeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "700",
  },
  envelopeDate: {
    color: color.textMuted,
    fontSize: 11,
  },
  envelopeArea: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  envelopeTapHint: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "500",
  },
  newBadge: {
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    color: color.textWhite,
    fontSize: 10,
    fontWeight: "800",
  },
});
