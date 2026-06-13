/**
 * DemoChallengeCard
 * チャレンジのヘッダー情報・進捗・イベント詳細を表示するカード
 */

import { StyleSheet, View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { formatJaDate, getDaysUntil } from "@/lib/date-utils";
import type { DemoChallengeData } from "@/features/demo/hooks/use-demo-challenge";
import type { DemoAnimations } from "@/features/demo/hooks/use-demo-animations";

interface DemoChallengeCardProps {
  challenge: DemoChallengeData;
  animations: Pick<DemoAnimations, "progressAnimatedStyle" | "numberAnimatedStyle">;
}

export function DemoChallengeCard({ challenge, animations }: DemoChallengeCardProps) {
  const colors = useColors();
  const progress = (challenge.currentValue / challenge.goalValue) * 100;
  const daysLeft = getDaysUntil(challenge.eventDate);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
          <Text style={styles.iconEmoji}>🎤</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.foreground }]}>{challenge.title}</Text>
          <Text style={[styles.hostText, { color: colors.muted }]}>
            主催: {challenge.hostName} (@{challenge.hostUsername})
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressNumbers}>
          <Animated.Text
            style={[styles.currentValue, { color: colors.foreground }, animations.numberAnimatedStyle]}
          >
            {challenge.currentValue}
          </Animated.Text>
          <Text style={[styles.goalText, { color: colors.muted }]}>/ {challenge.goalValue}人</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[styles.progressFill, { backgroundColor: colors.primary }, animations.progressAnimatedStyle]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: colors.muted }]}>
          達成率 {progress.toFixed(1)}%（参加予定）
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{formatJaDate(challenge.eventDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{challenge.venue}</Text>
        </View>
        <View style={[styles.daysLeftBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.daysLeftText, { color: colors.primary }]}>あと{daysLeft}日</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  hostText: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressNumbers: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 30,
    fontWeight: "bold",
  },
  goalText: {
    fontSize: 18,
  },
  progressTrack: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    marginLeft: 4,
  },
  daysLeftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
