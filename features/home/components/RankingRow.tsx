// features/home/components/RankingRow.tsx
// v6.16: 「参加する」クイックボタンを追加
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { homeText, homeUI, homeFont } from "@/features/home/ui/theme/tokens";
import type { Challenge } from "@/types/challenge";
import { AnimatedCard } from "@/components/molecules/animated-pressable";
import { LazyAvatar } from "@/components/molecules/lazy-image";
import { goalTypeConfig } from "@/constants/goal-types";
import { eventTypeBadge } from "@/types/challenge";

type Props = {
  rank: number; // 1-based
  challenge: Challenge;
  onPress: () => void;
  onQuickJoin?: () => void; // クイック参加ボタン
};

function rankLabel(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export function RankingRow({ rank, challenge, onPress, onQuickJoin }: Props) {
  const colors = useColors();
  const goalConfig = goalTypeConfig[challenge.goalType] || goalTypeConfig.custom;
  const typeBadge = eventTypeBadge[challenge.eventType] || eventTypeBadge.solo;

  const current = Math.max(Number(challenge.currentValue ?? 0), 0);
  const goal = Math.max(Number(challenge.goalValue ?? 0), 1);
  const progress = Math.min((current / goal) * 100, 100);
  const unit = challenge.goalUnit || goalConfig.unit;

  const eventDate = new Date(challenge.eventDate);
  const isDateUndecided = eventDate.getFullYear() === 9999;
  const formattedDate = isDateUndecided ? "未定" : `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;

  return (
    <AnimatedCard
      onPress={onPress}
      scaleAmount={0.99}
      style={{
        backgroundColor: homeUI.surface,
        borderWidth: 1,
        borderColor: homeUI.border,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <View style={styles.row}>
        {/* Rank */}
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: colors.foreground }]}>
            {rankLabel(rank)}
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LazyAvatar
            source={challenge.hostProfileImage ? { uri: challenge.hostProfileImage } : undefined}
            size={36}
            fallbackColor={homeText.accent}
            fallbackText={challenge.hostName?.charAt(0) || challenge.hostUsername?.charAt(0) || "?"}
            lazy
          />
        </View>

        {/* Main */}
        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeBadge.color }]}>
              <Text style={styles.typeBadgeText}>{typeBadge.label}</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {challenge.title}
            </Text>
          </View>

          <Text style={styles.hostName} numberOfLines={1}>
            {challenge.hostName}
          </Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressValue, { color: colors.foreground }]}>
                {current.toLocaleString()}
                <Text style={styles.progressGoal}> / {goal.toLocaleString()}{unit}</Text>
              </Text>

              <View style={styles.dateContainer}>
                <MaterialIcons name="event" size={12} color={homeText.accent} />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {/* クイック参加ボタン */}
        {onQuickJoin && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onQuickJoin();
            }}
            style={({ pressed }) => [
              styles.quickJoinButton,
              { backgroundColor: typeBadge.color, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankContainer: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: homeFont.title,
    fontWeight: "bold",
  },
  avatarContainer: {
    marginRight: 10,
  },
  mainContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: homeFont.meta,
    fontWeight: "bold",
  },
  title: {
    fontSize: homeFont.body,
    fontWeight: "bold",
    flex: 1,
  },
  hostName: {
    color: homeText.muted,
    fontSize: homeFont.meta,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressValue: {
    fontSize: homeFont.meta,
    fontWeight: "600",
  },
  progressGoal: {
    color: homeText.muted,
    fontSize: homeFont.meta,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: homeText.accent,
    fontSize: homeFont.meta,
  },
  progressBar: {
    height: 6,
    backgroundColor: homeUI.progressBar,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: homeText.accent,
  },
  quickJoinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
