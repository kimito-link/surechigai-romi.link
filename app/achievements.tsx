import { Text, View, Pressable, ScrollView, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EmojiIcon } from "@/components/ui/emoji-icon";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { AppHeader } from "@/components/organisms/app-header";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";

// アチーブメント定義
const ACHIEVEMENTS = [
  // 参加系
  { id: "first_participation", name: "はじめの一歩", description: "初めてチャレンジに参加した", icon: "🎉", type: "participation", rarity: "common", points: 10 },
  { id: "participate_5", name: "常連さん", description: "5つのチャレンジに参加した", icon: "⭐", type: "participation", rarity: "uncommon", points: 25 },
  { id: "participate_10", name: "応援マスター", description: "10のチャレンジに参加した", icon: "🌟", type: "participation", rarity: "rare", points: 50 },
  { id: "participate_25", name: "レジェンド", description: "25のチャレンジに参加した", icon: "👑", type: "participation", rarity: "epic", points: 100 },
  { id: "participate_50", name: "殿堂入り", description: "50のチャレンジに参加した", icon: "🏆", type: "participation", rarity: "legendary", points: 250 },
  
  // 主催系
  { id: "first_host", name: "初主催", description: "初めてチャレンジを主催した", icon: "🎤", type: "hosting", rarity: "uncommon", points: 30 },
  { id: "host_5", name: "イベンター", description: "5つのチャレンジを主催した", icon: "🎪", type: "hosting", rarity: "rare", points: 75 },
  { id: "host_10", name: "プロデューサー", description: "10のチャレンジを主催した", icon: "🎬", type: "hosting", rarity: "epic", points: 150 },
  
  // 招待系
  { id: "invite_1", name: "お誘い上手", description: "初めて友達を招待した", icon: "💌", type: "invitation", rarity: "common", points: 15 },
  { id: "invite_5", name: "招待達人", description: "5人を招待した", icon: "📨", type: "invitation", rarity: "uncommon", points: 40 },
  { id: "invite_10", name: "インフルエンサー", description: "10人を招待した", icon: "📣", type: "invitation", rarity: "rare", points: 80 },
  { id: "invite_25", name: "伝説の勧誘師", description: "25人を招待した", icon: "🌈", type: "invitation", rarity: "epic", points: 200 },
  
  // 貢献系
  { id: "contribution_10", name: "サポーター", description: "累計10人を動員した", icon: "💪", type: "contribution", rarity: "common", points: 20 },
  { id: "contribution_50", name: "エース", description: "累計50人を動員した", icon: "🔥", type: "contribution", rarity: "rare", points: 100 },
  { id: "contribution_100", name: "MVP", description: "累計100人を動員した", icon: "💎", type: "contribution", rarity: "legendary", points: 300 },
  
  // 連続参加系
  { id: "streak_3", name: "3日連続", description: "3日連続でチャレンジに参加した", icon: "🔗", type: "streak", rarity: "uncommon", points: 35 },
  { id: "streak_7", name: "1週間連続", description: "7日連続でチャレンジに参加した", icon: "⛓️", type: "streak", rarity: "rare", points: 70 },
  { id: "streak_30", name: "30日連続", description: "30日連続でチャレンジに参加した", icon: "🏅", type: "streak", rarity: "legendary", points: 500 },
  
  // 目標達成系
  { id: "goal_reached", name: "目標達成", description: "参加したチャレンジが目標を達成した", icon: "🎯", type: "special", rarity: "rare", points: 60 },
];

// レアリティの色（ダークモード専用・高視認性）
const RARITY_COLORS: Record<string, { bg: string; border: string; text: string; badgeBg: string; badgeText: string }> = {
  common: { bg: color.border, border: color.rarityCommonBorder, text: color.rarityCommonText, badgeBg: color.rarityCommonBadgeBg, badgeText: color.textWhite },
  uncommon: { bg: color.rarityUncommonBg, border: color.rarityUncommonBorder, text: color.rarityUncommonText, badgeBg: color.rarityUncommonBadgeBg, badgeText: color.textWhite },
  rare: { bg: color.rarityRareBg, border: color.rarityRareBorder, text: color.rarityRareText, badgeBg: color.rarityRareBadgeBg, badgeText: color.textWhite },
  epic: { bg: color.rarityEpicBg, border: color.rarityEpicBorder, text: color.rarityEpicText, badgeBg: color.rarityEpicBadgeBg, badgeText: color.textWhite },
  legendary: { bg: color.rarityLegendaryBg, border: color.rarityLegendaryBorder, text: color.rarityLegendaryText, badgeBg: color.rarityLegendaryBadgeBg, badgeText: color.rarityLegendaryBadgeText },
};

// レアリティの日本語名
const RARITY_NAMES: Record<string, string> = {
  common: "コモン",
  uncommon: "アンコモン",
  rare: "レア",
  epic: "エピック",
  legendary: "レジェンダリー",
};

// タイプの日本語名
const TYPE_NAMES: Record<string, string> = {
  participation: "参加",
  hosting: "主催",
  invitation: "招待",
  contribution: "貢献",
  streak: "連続",
  special: "特別",
};

// アチーブメントカード
function AchievementCard({ 
  achievement, 
  isUnlocked, 
  progress,
  maxProgress,
}: { 
  achievement: typeof ACHIEVEMENTS[0]; 
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}) {
  const colors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
  
  return (
    <View
      style={{
        backgroundColor: isUnlocked ? colors.bg : color.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: isUnlocked ? colors.border : color.border,
        opacity: isUnlocked ? 1 : 0.6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isUnlocked ? colors.border : color.border,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {isUnlocked ? (
            <EmojiIcon emoji={achievement.icon} size={24} />
          ) : (
            <MaterialIcons name="lock" size={24} color={color.textSubtle} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ color: isUnlocked ? colors.text : color.textSubtle, fontSize: 16, fontWeight: "bold" }}>
              {achievement.name}
            </Text>
            <View
              style={{
                backgroundColor: colors.badgeBg,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: colors.badgeText, fontSize: 12, fontWeight: "bold" }}>
                {RARITY_NAMES[achievement.rarity] || 'コモン'}
              </Text>
            </View>
          </View>
          <Text style={{ color: color.rarityCommonText, fontSize: 13 }}>
            {achievement.description}
          </Text>
          {/* 進捗バー（未解除の場合） */}
          {!isUnlocked && progress !== undefined && maxProgress !== undefined && (
            <View style={{ marginTop: 8 }}>
              <View style={{ height: 4, backgroundColor: color.border, borderRadius: 2, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min((progress / maxProgress) * 100, 100)}%`,
                    backgroundColor: colors.border,
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text style={{ color: color.textSubtle, fontSize: 12, marginTop: 4 }}>
                {progress} / {maxProgress}
              </Text>
            </View>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: isUnlocked ? color.rankGold : color.textSubtle, fontSize: 14, fontWeight: "bold" }}>
            +{achievement.points}
          </Text>
          <Text style={{ color: color.textSubtle, fontSize: 12 }}>ポイント</Text>
        </View>
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const { user } = useAuth();

  // ユーザーの統計情報を取得
  const { data: myParticipations = [], isFetching: participationsFetching } = trpc.participations.myParticipations.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: myEvents = [], isFetching: eventsFetching } = trpc.events.myEvents.useQuery(undefined, {
    enabled: !!user,
  });

  // ローディング状態を分離
  const isFetching = participationsFetching || eventsFetching;
  const hasData = myParticipations.length >= 0 && myEvents.length >= 0;
  const isRefreshing = isFetching && hasData;

  // アチーブメントの解除状況を計算
  const achievementStatus = useMemo(() => {
    const participationCount = myParticipations.length;
    const hostCount = myEvents.length;
    const totalContribution = myParticipations.reduce((sum, p) => sum + (p.contribution || 1), 0);
    
    // 招待数は仮で0（実際はDBから取得する必要がある）
    const inviteCount = 0;
    
    // 連続参加日数は仮で0（実際は日付を計算する必要がある）
    const streakDays = 0;
    
    // 目標達成したチャレンジ数は仮で0
    const goalReachedCount = 0;
    
    return ACHIEVEMENTS.map(achievement => {
      let isUnlocked = false;
      let progress = 0;
      let maxProgress = 1;
      
      switch (achievement.id) {
        case "first_participation":
          isUnlocked = participationCount >= 1;
          progress = participationCount;
          maxProgress = 1;
          break;
        case "participate_5":
          isUnlocked = participationCount >= 5;
          progress = participationCount;
          maxProgress = 5;
          break;
        case "participate_10":
          isUnlocked = participationCount >= 10;
          progress = participationCount;
          maxProgress = 10;
          break;
        case "participate_25":
          isUnlocked = participationCount >= 25;
          progress = participationCount;
          maxProgress = 25;
          break;
        case "participate_50":
          isUnlocked = participationCount >= 50;
          progress = participationCount;
          maxProgress = 50;
          break;
        case "first_host":
          isUnlocked = hostCount >= 1;
          progress = hostCount;
          maxProgress = 1;
          break;
        case "host_5":
          isUnlocked = hostCount >= 5;
          progress = hostCount;
          maxProgress = 5;
          break;
        case "host_10":
          isUnlocked = hostCount >= 10;
          progress = hostCount;
          maxProgress = 10;
          break;
        case "invite_1":
          isUnlocked = inviteCount >= 1;
          progress = inviteCount;
          maxProgress = 1;
          break;
        case "invite_5":
          isUnlocked = inviteCount >= 5;
          progress = inviteCount;
          maxProgress = 5;
          break;
        case "invite_10":
          isUnlocked = inviteCount >= 10;
          progress = inviteCount;
          maxProgress = 10;
          break;
        case "invite_25":
          isUnlocked = inviteCount >= 25;
          progress = inviteCount;
          maxProgress = 25;
          break;
        case "contribution_10":
          isUnlocked = totalContribution >= 10;
          progress = totalContribution;
          maxProgress = 10;
          break;
        case "contribution_50":
          isUnlocked = totalContribution >= 50;
          progress = totalContribution;
          maxProgress = 50;
          break;
        case "contribution_100":
          isUnlocked = totalContribution >= 100;
          progress = totalContribution;
          maxProgress = 100;
          break;
        case "streak_3":
          isUnlocked = streakDays >= 3;
          progress = streakDays;
          maxProgress = 3;
          break;
        case "streak_7":
          isUnlocked = streakDays >= 7;
          progress = streakDays;
          maxProgress = 7;
          break;
        case "streak_30":
          isUnlocked = streakDays >= 30;
          progress = streakDays;
          maxProgress = 30;
          break;
        case "goal_reached":
          isUnlocked = goalReachedCount >= 1;
          progress = goalReachedCount;
          maxProgress = 1;
          break;
      }
      
      return {
        ...achievement,
        isUnlocked,
        progress,
        maxProgress,
      };
    });
  }, [myParticipations, myEvents]);

  // 統計
  const stats = useMemo(() => {
    const unlocked = achievementStatus.filter(a => a.isUnlocked).length;
    const total = achievementStatus.length;
    const points = achievementStatus.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);
    return { unlocked, total, points };
  }, [achievementStatus]);

  // タイプ別にグループ化
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, typeof achievementStatus> = {};
    achievementStatus.forEach(a => {
      if (!groups[a.type]) groups[a.type] = [];
      groups[a.type].push(a);
    });
    return groups;
  }, [achievementStatus]);

  if (!user) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted, fontSize: 16 }}>ログインしてください</Text>
          <Pressable
            onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigate.toMypageTab(); }}
            style={({ pressed }) => [{ marginTop: 16, padding: 12 }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={{ color: color.accentPrimary }}>ログイン画面へ</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {isRefreshing && <RefreshingIndicator isRefreshing={isRefreshing} />}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <Pressable
              onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigate.back(); }}
              style={({ pressed }) => [{ flexDirection: "row", alignItems: "center" }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
            >
              <MaterialIcons name="arrow-back" size={24} color={color.textWhite} />
              <Text style={{ color: color.textWhite, marginLeft: 8 }}>戻る</Text>
            </Pressable>
          }
        />
        <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
          アチーブメント
        </Text>

        {/* 統計サマリー */}
        <LinearGradient
          colors={[color.accentPrimary, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 12, padding: 20, marginBottom: 24 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: color.textWhite, fontSize: 28, fontWeight: "bold" }}>
                {stats.unlocked}
              </Text>
              <Text style={{ color: color.textWhite + "CC", fontSize: 12 }}>
                解除済み
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: color.textWhite, fontSize: 28, fontWeight: "bold" }}>
                {stats.total}
              </Text>
              <Text style={{ color: color.textWhite + "CC", fontSize: 12 }}>
                全アチーブメント
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: color.rankGold, fontSize: 28, fontWeight: "bold" }}>
                {stats.points}
              </Text>
              <Text style={{ color: color.textWhite + "CC", fontSize: 12 }}>
                獲得ポイント
              </Text>
            </View>
          </View>
          {/* 進捗バー */}
          <View style={{ marginTop: 16 }}>
            <View style={{ height: 8, backgroundColor: color.textWhite + "4D", borderRadius: 4, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${(stats.unlocked / stats.total) * 100}%`,
                  backgroundColor: color.textWhite,
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ color: color.textWhite + "CC", fontSize: 12, textAlign: "center", marginTop: 4 }}>
              {((stats.unlocked / stats.total) * 100).toFixed(0)}% コンプリート
            </Text>
          </View>
        </LinearGradient>

        {/* タイプ別アチーブメント */}
        {Object.entries(groupedAchievements).map(([type, achievements]) => (
          <View key={type} style={{ marginBottom: 24 }}>
            <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              {TYPE_NAMES[type] || type}
            </Text>
            {achievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={achievement.isUnlocked}
                progress={achievement.progress}
                maxProgress={achievement.maxProgress}
              />
            ))}
          </View>
        ))}

        {/* 余白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
