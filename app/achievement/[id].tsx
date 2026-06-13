import { View, Text, ScrollView, Pressable, Platform, Share } from "react-native";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EmojiIcon } from "@/components/ui/emoji-icon";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { AppHeader } from "@/components/organisms/app-header";

type Participation = {
  id: number;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  companionCount: number;
  contribution: number;
  prefecture: string | null;
  isAnonymous: boolean;
  userId: number | null;
};

export default function AchievementPage() {
  const colors = useColors();

  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = parseInt(id || "0", 10);
  
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  
  const { data: challenge, isLoading: challengeLoading } = trpc.events.getById.useQuery({ id: challengeId });
  const { data: achievementPage, isLoading: achievementLoading } = trpc.achievements.get.useQuery({ challengeId });
  const { data: participations, isLoading: participationsLoading } = trpc.participations.listByEvent.useQuery({ eventId: challengeId });

  const handleShare = async () => {
    if (!challenge || !achievementPage) return;
    
    try {
      await Share.share({
        message: `🎉 ${challenge.title} 目標達成！\n\n${achievementPage.finalValue}${challenge.goalUnit || "人"}の目標を達成しました！\n${achievementPage.totalParticipants}人の仲間と一緒に！\n\n#動員ちゃれんじ #君斗りんく`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (challengeLoading || achievementLoading || participationsLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
          <Text style={{ color: color.textMuted }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!challenge) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
          <Text style={{ color: color.textMuted }}>チャレンジが見つかりません</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!achievementPage) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
          <Text style={{ color: color.textMuted }}>達成記念ページはまだ作成されていません</Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateBack();
            }}
            style={({ pressed }) => [{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: color.accentPrimary, borderRadius: 24 }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={{ color: colors.foreground, fontWeight: "bold" }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const achievedDate = new Date(achievementPage.achievedAt);
  const formattedDate = `${achievedDate.getFullYear()}年${achievedDate.getMonth() + 1}月${achievedDate.getDate()}日`;
  const displayedParticipants = showAllParticipants ? participations : participations?.slice(0, 20);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Pressable onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleShare(); }} style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}>
                <MaterialIcons name="share" size={24} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigateBack(); }}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center" }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
              >
                <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
                <Text style={{ color: colors.foreground, marginLeft: 8 }}>戻る</Text>
              </Pressable>
            </View>
          }
        />
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>
            達成記念ページ
          </Text>
        </View>

        {/* 達成バナー */}
        <LinearGradient
          colors={[color.accentPrimary, color.accentAlt, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 16, borderRadius: 24, padding: 24, alignItems: "center" }}
        >
          <View style={{ marginBottom: 8 }}>
            <EmojiIcon emoji="🎉" size={64} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
            目標達成！
          </Text>
          <Text style={{ color: color.textWhite, fontSize: 18, textAlign: "center", opacity: 0.9 }}>
            {achievementPage.title || challenge.title}
          </Text>
        </LinearGradient>

        {/* 統計情報 */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: color.accentPrimary, fontSize: 36, fontWeight: "bold" }}>
                  {achievementPage.finalValue}
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12 }}>
                  達成{challenge.goalUnit || "人"}数
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: color.border }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: color.accentAlt, fontSize: 36, fontWeight: "bold" }}>
                  {achievementPage.totalParticipants}
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12 }}>
                  参加者数
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: color.border }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: color.accentAlt, fontSize: 36, fontWeight: "bold" }}>
                  {Math.round((achievementPage.finalValue / achievementPage.goalValue) * 100)}%
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12 }}>
                  達成率
                </Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: color.border, paddingTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <MaterialIcons name="event" size={16} color={color.hostAccentLegacy} />
                <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 8 }}>
                  達成日: {formattedDate}
                </Text>
              </View>
              {challenge.venue && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="place" size={16} color={color.textMuted} />
                  <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 8 }}>
                    {challenge.venue}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* メッセージ */}
        {achievementPage.message && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, lineHeight: 24 }}>
                {achievementPage.message}
              </Text>
            </View>
          </View>
        )}

        {/* 参加者一覧 */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <MaterialIcons name="people" size={24} color={color.accentPrimary} />
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>
                参加者の皆さん
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={{ color: color.textMuted, fontSize: 14 }}>
                {participations?.length || 0}人
              </Text>
            </View>

            {/* 参加者グリッド */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {displayedParticipants?.map((p: Participation) => (
                <View
                  key={p.id}
                  style={{
                    alignItems: "center",
                    width: 72,
                    marginBottom: 8,
                  }}
                >
                  {p.profileImage && !p.isAnonymous ? (
                    <Image
                      source={{ uri: p.profileImage }}
                      style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 4 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: color.accentPrimary,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>
                        {(p.isAnonymous ? "匿" : p.displayName.charAt(0))}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{ color: color.textMuted, fontSize: 12, textAlign: "center" }}
                    numberOfLines={1}
                  >
                    {p.isAnonymous ? "匿名" : p.displayName}
                  </Text>
                  {p.contribution > 1 && (
                    <Text style={{ color: color.accentPrimary, fontSize: 12 }}>
                      +{p.contribution}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* もっと見るボタン */}
            {participations && participations.length > 20 && !showAllParticipants && (
              <Pressable
                onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAllParticipants(true); }}
                style={({ pressed }) => [{
                  marginTop: 16,
                  paddingVertical: 12,
                  backgroundColor: color.border,
                  borderRadius: 12,
                  alignItems: "center",
                }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
              >
                <Text style={{ color: color.accentPrimary, fontWeight: "bold" }}>
                  すべての参加者を見る ({participations.length - 20}人)
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* 感謝メッセージ */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <LinearGradient
            colors={[`${color.accentPrimary}33`, `${color.accentAlt}33`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 24, alignItems: "center", opacity: 1 }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>💖</Text>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
              ありがとうございました！
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              皆さんの応援のおかげで目標を達成することができました。{"\n"}
              これからも一緒に応援していきましょう！
            </Text>
          </LinearGradient>
        </View>

        {/* シェアボタン */}
        <View style={{ padding: 16, paddingBottom: 48 }}>
          <Pressable
            onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleShare(); }}
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: color.twitter,
              paddingVertical: 16,
              borderRadius: 24,
            }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          >
            <MaterialIcons name="share" size={20} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
              達成をシェアする
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
