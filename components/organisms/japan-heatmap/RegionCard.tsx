/**
 * RegionCard - 地域カード
 * 
 * 単一責任: 単一の地域情報の表示のみ
 */

import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { getHeatColor } from "./utils";
import type { RegionCardProps } from "./types";

export function RegionCard({ 
  region, 
  count, 
  maxCount, 
  isHot, 
  onPress 
}: RegionCardProps) {
  const intensity = maxCount > 0 ? count / maxCount : 0;
  const regionHeatColor = count > 0 ? getHeatColor(count, maxCount) : color.heatmapNone;

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.regionCard,
        isHot && styles.regionCardHot,
        { borderColor: count > 0 ? regionHeatColor : color.heatmapNone },
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.regionCardHeader}>
        <View style={[styles.colorDot, { backgroundColor: regionHeatColor }]} />
        <Text style={styles.regionName}>{region.name}</Text>
        {isHot && <Text style={styles.hotEmoji}>🔥</Text>}
      </View>
      <Text style={[styles.regionCount, { color: count > 0 ? color.tutorialText : color.textSubtle }]}>
        {count.toLocaleString()}<Text style={styles.regionUnit}>人</Text>
      </Text>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${intensity * 100}%`, backgroundColor: regionHeatColor }
          ]} 
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  regionCard: {
    width: "48%",
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  regionCardHot: {
    backgroundColor: palette.red500 + "1A", // 10% opacity
    borderWidth: 2,
  },
  regionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  regionName: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  hotEmoji: {
    fontSize: 12,
  },
  regionCount: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  regionUnit: {
    fontSize: 12,
    fontWeight: "normal",
  },
  progressBar: {
    height: 4,
    backgroundColor: color.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
