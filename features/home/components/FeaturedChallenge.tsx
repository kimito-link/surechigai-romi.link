/**
 * 注目のチャレンジコンポーネント
 * ホーム画面のトップに表示される注目チャレンジカード
 */
import { View, Text , Platform} from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { homeColor, homeGradient, homeUI, homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { PressableCard } from "@/components/molecules/pressable-card";
import { Countdown } from "@/components/atoms/countdown";
import { goalTypeConfig } from "@/constants/goal-types";
import type { Challenge } from "@/types/challenge";

interface FeaturedChallengeProps {
  /** チャレンジデータ */
  challenge: Challenge;
  /** タップ時のコールバック */
  onPress: () => void;
}

export function FeaturedChallenge({ challenge, onPress }: FeaturedChallengeProps) {
  const colors = useColors();
  const eventDate = new Date(challenge.eventDate);
  const isDateUndecided = eventDate.getFullYear() === 9999;
  const progress = Math.min((challenge.currentValue / challenge.goalValue) * 100, 100);
  const goalConfig = goalTypeConfig[challenge.goalType] || goalTypeConfig.custom;
  const unit = challenge.goalUnit || goalConfig.unit;
  const remaining = Math.max(challenge.goalValue - challenge.currentValue, 0);

  return (
    <PressableCard
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: homeColor.accent,
      }}
    >
      <LinearGradient
        colors={homeGradient.pinkPurpleIndigo}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        {/* 注目バッジ */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ backgroundColor: homeColor.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: homeFont.meta, fontWeight: "bold" }}>🔥 注目のチャレンジ</Text>
          </View>
          {!isDateUndecided && (
            <View style={{ marginLeft: "auto" }}>
              <Countdown targetDate={challenge.eventDate} compact />
            </View>
          )}
        </View>

        {/* タイトル */}
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
          {challenge.title}
        </Text>

        {/* 作成者情報 */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          {challenge.hostProfileImage ? (
            <Image
              source={{ uri: challenge.hostProfileImage }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.2)",
                marginRight: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: homeFont.body, fontWeight: "bold" }}>
                {(challenge.hostName || "?").charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ color: colors.foreground, fontSize: homeFont.body, fontWeight: "600" }}>{challenge.hostName}</Text>
            {challenge.hostUsername && (
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: homeFont.meta }}>@{challenge.hostUsername}</Text>
            )}
          </View>
        </View>

        {/* 大きな進捗表示 */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ color: colors.foreground, fontSize: 48, fontWeight: "bold" }}>
            {challenge.currentValue}
            <Text style={{ fontSize: 20, color: "rgba(255,255,255,0.7)" }}>
              {" "}
              / {challenge.goalValue}
              {unit}
            </Text>
          </Text>
          <Text style={{ color: homeUI.iconBgGold, fontSize: homeFont.title, fontWeight: "bold", marginTop: 4 }}>
            あと{remaining}
            {unit}で目標達成！
          </Text>
        </View>

        {/* 進捗バー */}
        <View style={{ height: 12, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, overflow: "hidden" }}>
          <LinearGradient
            colors={homeGradient.goldOrange}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: "100%", width: `${progress}%`, borderRadius: 6 }}
          />
        </View>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: homeFont.meta, textAlign: "right", marginTop: 4 }}>
          {progress.toFixed(1)}% 達成
        </Text>
      </LinearGradient>
    </PressableCard>
  );
}
