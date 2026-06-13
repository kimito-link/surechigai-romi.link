/**
 * 貢献度ランキングコンポーネント
 * 参加者の貢献度をランキング形式で表示
 */
import { View, Text } from "react-native";
import { navigate } from "@/lib/navigation";
import { useColors } from "@/hooks/use-colors";
import { color } from "@/theme/tokens";
import { eventText, eventFont, eventUI } from "@/features/events/ui/theme/tokens";
import { OptimizedAvatar } from "@/components/molecules/optimized-image";
import { Button } from "@/components/ui/button";
import type { Participation } from "@/types/participation";

export interface ContributionRankingProps {
  /** 参加者リスト */
  participations: Participation[];
  /** フォロワーのユーザーIDリスト（優先表示用） */
  followerIds?: number[];
  /** 表示する最大人数（デフォルト: 5） */
  maxDisplay?: number;
}

/** ランキングアイテムのViewModel */
export interface RankingItemVM {
  key: string;
  rank: number;
  twitterId: string;
  displayName: string;
  username?: string;
  profileImage?: string;
  valueText: string;
}

export function ContributionRanking({
  participations,
  followerIds = [],
  maxDisplay = 5,
}: ContributionRankingProps) {
  const colors = useColors();
  
  const followerSet = new Set(followerIds);

  // フォロワーを優先表示（同じ貢献度の場合フォロワーが上）
  const sorted = [...participations]
    .sort((a, b) => {
      const aContrib = b.contribution || 1;
      const bContrib = a.contribution || 1;
      if (aContrib !== bContrib) return aContrib - bContrib;
      // 同じ貢献度の場合、フォロワーを優先
      const aIsFollower = a.userId ? followerSet.has(a.userId) : false;
      const bIsFollower = b.userId ? followerSet.has(b.userId) : false;
      if (aIsFollower && !bIsFollower) return -1;
      if (!aIsFollower && bIsFollower) return 1;
      return 0;
    })
    .slice(0, maxDisplay);

  if (sorted.length === 0) return null;

  const rankBgColors = [color.rankGold, color.rankSilver, color.rankBronze] as const;
  const getRankColor = (index: number) =>
    index < 3 ? rankBgColors[index] : color.surfaceAlt;
  const rankBorderColor = (index: number) =>
    index === 0 ? color.rankGold : color.border;

  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ color: colors.foreground, fontSize: eventFont.title, fontWeight: "bold", marginBottom: 12 }}>
        貢献度ランキング
      </Text>
      {sorted.map((p, index) => (
        <View
          key={p.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: color.surface,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            borderWidth: index === 0 ? 2 : 1,
            borderColor: rankBorderColor(index),
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: getRankColor(index),
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: index < 3 ? color.bg : color.textWhite, fontSize: eventFont.meta, fontWeight: "bold" }}>
              {index + 1}
            </Text>
          </View>
          <View style={{ marginRight: 12 }}>
            <OptimizedAvatar
              source={p.profileImage && !p.isAnonymous ? { uri: p.profileImage } : undefined}
              size={36}
              fallbackColor={eventUI.fallback}
              fallbackText={p.displayName.charAt(0)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: colors.foreground, fontSize: eventFont.body, fontWeight: "600" }}>
                {p.isAnonymous ? "匿名" : p.displayName}
              </Text>
              {/* 性別アイコン */}
              {p.gender && p.gender !== "unspecified" && (
                <Text style={{ marginLeft: 4, fontSize: eventFont.meta }}>
                  {p.gender === "male" ? "👨" : "👩"}
                </Text>
              )}
              {p.userId && followerSet.has(p.userId) && (
                <View
                  style={{
                    marginLeft: 6,
                    backgroundColor: eventUI.badgeFollower,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: eventFont.small, fontWeight: "bold" }}>フォロワー</Text>
                </View>
              )}
            </View>
            {/* 都道府県とユーザー名 */}
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
              {p.prefecture && (
                <Text style={{ color: eventText.hint, fontSize: eventFont.small }}>📍{p.prefecture}</Text>
              )}
              {p.username && !p.isAnonymous && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => { if (p.userId) navigate.toProfile(p.userId); }}
                  style={{ flexDirection: "row", alignItems: "center", padding: 0 }}
                >
                  <Text style={{ color: eventText.username, fontSize: eventFont.username }}>@{p.username}</Text>
                </Button>
              )}
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: eventText.accent, fontSize: eventFont.title, fontWeight: "bold" }}>+{p.contribution || 1}</Text>
            <Text style={{ color: eventText.hint, fontSize: eventFont.small }}>
              {p.companionCount > 0 ? `(本人+${p.companionCount}人)` : ""}
            </Text>
            {p.followersCount && p.followersCount > 0 && (
              <Text style={{ color: eventText.muted, fontSize: eventFont.meta, marginTop: 2 }}>
                {p.followersCount >= 10000
                  ? `${(p.followersCount / 10000).toFixed(1)}万`
                  : p.followersCount.toLocaleString()}
                フォロワー
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
