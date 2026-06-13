// features/home/components/RankingTop3.tsx
// v6.17: 横長ランキングカードに改善（1位を大きく、2-3位を横並び、全てにクイックボタン）
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";
import { homeText, homeUI, homeFont } from "@/features/home/ui/theme/tokens";
import type { Challenge } from "@/types/challenge";
import { goalTypeConfig } from "@/constants/goal-types";
import { eventTypeBadge } from "@/types/challenge";

type Props = {
  top3: Challenge[];
  onPress: (id: number) => void;
  onQuickJoin?: (id: number) => void;
};

// ランクごとの色
const rankColors = {
  1: { bg: "#FFD700", text: "#000", medal: "🥇", gradient: ["#FFD700", "#FFA500"] },
  2: { bg: "#C0C0C0", text: "#000", medal: "🥈", gradient: ["#C0C0C0", "#A0A0A0"] },
  3: { bg: "#CD7F32", text: "#fff", medal: "🥉", gradient: ["#CD7F32", "#8B4513"] },
};

export function RankingTop3({ top3, onPress, onQuickJoin }: Props) {
  const colors = useColors();

  if (!top3?.length) return null;

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <MaterialIcons name="emoji-events" size={20} color={homeText.accent} />
        <Text style={[styles.title, { color: colors.foreground }]}>今熱いチャレンジ</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TOP3</Text>
        </View>
      </View>

      {/* 1位: 大きなカード */}
      {first && (
        <RankingCard
          rank={1}
          challenge={first}
          onPress={() => onPress(first.id)}
          onQuickJoin={onQuickJoin ? () => onQuickJoin(first.id) : undefined}
          isLarge
          colors={colors}
        />
      )}

      {/* 2-3位: 横並び */}
      {(second || third) && (
        <View style={styles.secondRow}>
          {second && (
            <View style={styles.halfCard}>
              <RankingCard
                rank={2}
                challenge={second}
                onPress={() => onPress(second.id)}
                onQuickJoin={onQuickJoin ? () => onQuickJoin(second.id) : undefined}
                colors={colors}
              />
            </View>
          )}
          {third && (
            <View style={styles.halfCard}>
              <RankingCard
                rank={3}
                challenge={third}
                onPress={() => onPress(third.id)}
                onQuickJoin={onQuickJoin ? () => onQuickJoin(third.id) : undefined}
                colors={colors}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// 個別のランキングカード
function RankingCard({
  rank,
  challenge,
  onPress,
  onQuickJoin,
  isLarge = false,
  colors,
}: {
  rank: 1 | 2 | 3;
  challenge: Challenge;
  onPress: () => void;
  onQuickJoin?: () => void;
  isLarge?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const rankStyle = rankColors[rank];
  const config = goalTypeConfig[challenge.goalType] || goalTypeConfig.attendance;
  const typeBadge = eventTypeBadge[challenge.eventType] || eventTypeBadge.solo;
  const progress = challenge.goalValue > 0 
    ? Math.min(100, Math.round((challenge.currentValue / challenge.goalValue) * 100))
    : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { 
          backgroundColor: colors.surface,
          borderColor: homeUI.border,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        isLarge && styles.cardLarge,
      ]}
    >
      {/* ランクバッジ */}
      <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
        <Text style={[styles.rankText, { color: rankStyle.text }]}>{rank}</Text>
      </View>

      {/* サムネイル */}
      <View style={[styles.thumbnail, isLarge && styles.thumbnailLarge]}>
        {challenge.hostProfileImage ? (
          <Image
            source={{ uri: challenge.hostProfileImage }}
            style={styles.thumbnailImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: typeBadge.color + "30" }]}>
            <MaterialIcons name={config.icon as any} size={isLarge ? 32 : 24} color={typeBadge.color} />
          </View>
        )}
      </View>

      {/* 情報 */}
      <View style={[styles.info, isLarge && styles.infoLarge]}>
        <Text 
          style={[styles.challengeTitle, { color: colors.foreground }, isLarge && styles.titleLarge]} 
          numberOfLines={isLarge ? 2 : 1}
        >
          {challenge.title}
        </Text>
        
        <View style={styles.stats}>
          <Text style={[styles.statText, { color: homeText.muted }]}>
            {challenge.currentValue.toLocaleString()}/{challenge.goalValue.toLocaleString()} {config.unit}
          </Text>
          <View style={[styles.progressBadge, { backgroundColor: typeBadge.color + "20" }]}>
            <Text style={[styles.progressText, { color: typeBadge.color }]}>{progress}%</Text>
          </View>
        </View>

        {/* プログレスバー */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%`, backgroundColor: typeBadge.color }
            ]} 
          />
        </View>
      </View>

      {/* クイック参加ボタン（全てのカードに表示） */}
      {onQuickJoin && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onQuickJoin();
          }}
          style={({ pressed }) => [
            styles.quickJoinButton,
            isLarge && styles.quickJoinButtonLarge,
            { backgroundColor: typeBadge.color, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <MaterialIcons name="add" size={isLarge ? 20 : 16} color="#fff" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginHorizontal: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: homeFont.title,
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: homeText.accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: homeText.accent,
    fontSize: homeFont.meta,
    fontWeight: "bold",
  },
  secondRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfCard: {
    flex: 1,
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
    gap: 10,
    alignItems: "center",
  },
  cardLarge: {
    padding: 12,
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  rankText: {
    fontSize: homeFont.meta,
    fontWeight: "bold",
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnailLarge: {
    width: 72,
    height: 72,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  infoLarge: {
    gap: 6,
  },
  challengeTitle: {
    fontSize: homeFont.meta,
    fontWeight: "600",
  },
  titleLarge: {
    fontSize: homeFont.body,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: homeFont.meta,
  },
  progressBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressText: {
    fontSize: homeFont.meta,
    fontWeight: "bold",
  },
  progressBar: {
    height: 4,
    backgroundColor: homeUI.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  quickJoinButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  quickJoinButtonLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
