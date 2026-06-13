/**
 * DemoJoinSection
 * 参加ボタン・参加済み表示・友達を誘うボタン・お祝いメッセージ
 */

import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { color } from "@/theme/tokens";
import type { DemoAnimations } from "@/features/demo/hooks/use-demo-animations";

interface DemoJoinSectionProps {
  hasJoined: boolean;
  contribution: number;
  joining: boolean;
  onJoin: () => void;
  onAddContribution: () => void;
  animations: Pick<DemoAnimations, "buttonAnimatedStyle" | "celebrationAnimatedStyle">;
}

export function DemoJoinSection({
  hasJoined,
  contribution,
  joining,
  onJoin,
  onAddContribution,
  animations,
}: DemoJoinSectionProps) {
  const colors = useColors();

  return (
    <>
      {!hasJoined ? (
        <Animated.View style={animations.buttonAnimatedStyle}>
          <Pressable
            onPress={onJoin}
            disabled={joining}
            accessibilityRole="button"
            accessibilityLabel="デモチャレンジに参加する"
            accessibilityState={{ busy: joining, disabled: joining }}
            style={({ pressed }) => [
              styles.joinButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            {joining ? (
              <ActivityIndicator color={color.textWhite} />
            ) : (
              <View style={styles.row}>
                <Ionicons name="hand-right" size={24} color={color.textWhite} />
                <Text style={styles.joinButtonText}>参加する（お試し）</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      ) : (
        <View>
          <View style={[styles.joinedBadge, { backgroundColor: colors.success + "20" }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={[styles.joinedText, { color: colors.success }]}>参加中！</Text>
          </View>
          <Text style={[styles.contributionText, { color: colors.muted }]}>
            あなたの貢献: {contribution}人
          </Text>
          <Pressable
            onPress={onAddContribution}
            accessibilityRole="button"
            accessibilityLabel="友達を誘って参加人数を増やす"
            style={({ pressed }) => [
              styles.inviteButton,
              { backgroundColor: colors.surface, borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={styles.row}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.inviteButtonText, { color: colors.primary }]}>友達を誘う（+1人）</Text>
            </View>
          </Pressable>
        </View>
      )}

      <Animated.View
        style={[styles.celebration, animations.celebrationAnimatedStyle]}
        pointerEvents="none"
      >
        <View style={[styles.celebrationBubble, { backgroundColor: colors.primary }]}>
          <Text style={styles.celebrationTitle}>🎉 参加ありがとう！</Text>
          <Text style={styles.celebrationBody}>一緒に目標を達成しよう！</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  joinButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinedBadge: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  joinedText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  contributionText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  inviteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  inviteButtonText: {
    fontWeight: "600",
    marginLeft: 8,
  },
  celebration: {
    position: "absolute",
    top: "33.33%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  celebrationBubble: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  celebrationTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  celebrationBody: {
    color: "#ffffff",
    textAlign: "center",
    marginTop: 4,
  },
});
