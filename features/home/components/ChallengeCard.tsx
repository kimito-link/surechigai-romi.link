/**
 * チャレンジカードコンポーネント
 * ホーム画面のグリッドに表示されるチャレンジカード
 */
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { homeColor, homeGradient, homeUI, homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { useResponsive } from "@/hooks/use-responsive";
import { AnimatedCard } from "@/components/molecules/animated-pressable";
import { LazyAvatar } from "@/components/molecules/lazy-image";
import { Countdown } from "@/components/atoms/countdown";
import { goalTypeConfig } from "@/constants/goal-types";
import type { Challenge } from "@/types/challenge";
import { eventTypeBadge } from "@/types/challenge";

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: () => void;
  numColumns?: number;
  width?: number; // px幅（useGridLayoutから渡す）
  colorIndex?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function ChallengeCard({
  challenge,
  onPress,
  numColumns = 2,
  width,
  colorIndex: _colorIndex,
  isFavorite: _isFavorite = false,
  onToggleFavorite: _onToggleFavorite,
}: ChallengeCardProps) {
  const colors = useColors();
  const { isDesktop } = useResponsive();
  const eventDate = new Date(challenge.eventDate);
  const isDateUndecided = eventDate.getFullYear() === 9999;
  const formattedDate = isDateUndecided ? "未定" : `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;

  const progress = Math.min((challenge.currentValue / challenge.goalValue) * 100, 100);
  const goalConfig = goalTypeConfig[challenge.goalType] || goalTypeConfig.custom;
  const typeBadge = eventTypeBadge[challenge.eventType] || eventTypeBadge.solo;
  const unit = challenge.goalUnit || goalConfig.unit;
  const remaining = Math.max(challenge.goalValue - challenge.currentValue, 0);

  // width(px)が来たらそれを使用、来なければ従来互換でフォールバック
  const fallbackCardWidth = numColumns === 3 ? "31%" : numColumns === 2 ? "47%" : "100%";
  const cardWidth = width ?? fallbackCardWidth;

  return (
    <AnimatedCard
      onPress={onPress}
      scaleAmount={0.98}
      style={{
        backgroundColor: homeUI.surface,
        borderRadius: 12,
        // marginは0にしてgapで管理（FlatListのcolumnWrapperStyleで制御）
        overflow: "hidden",
        borderWidth: 1,
        borderColor: homeUI.border,
        width: cardWidth as any,
        marginBottom: 8, // 行間の余白
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}>
        <View style={{ backgroundColor: typeBadge.color, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: colors.foreground, fontSize: homeFont.meta, fontWeight: "bold" }}>{typeBadge.label}</Text>
        </View>
      </View>

      <LinearGradient
        colors={homeGradient.pinkPurple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 60, justifyContent: "flex-end", paddingHorizontal: 12, paddingBottom: 8 }}
      >
        <View style={{ position: "absolute", top: 8, right: 8 }}>
          <MaterialIcons name={goalConfig.icon as any} size={16} color="rgba(255,255,255,0.7)" />
        </View>
        {challenge.venue && (
          <View style={{ position: "absolute", top: 8, left: 8, right: 32 }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: homeFont.small, fontWeight: "600" }} numberOfLines={1}>
              {challenge.venue}
            </Text>
          </View>
        )}
        <View style={{ position: "absolute", bottom: -16, left: 12 }}>
          <LazyAvatar
            source={challenge.hostProfileImage && challenge.hostProfileImage.trim() !== "" ? { uri: challenge.hostProfileImage } : undefined}
            size={32}
            fallbackColor={homeColor.fallback}
            fallbackText={challenge.hostName?.charAt(0) || challenge.hostUsername?.charAt(0) || "?"}
            lazy={true}
          />
        </View>
      </LinearGradient>

      <View style={{ padding: 16, paddingTop: 20 }}>
        <Text style={{ color: colors.foreground, fontSize: homeFont.body, fontWeight: "bold", marginBottom: 4 }} numberOfLines={2}>
          {challenge.title}
        </Text>
        <Text style={{ color: homeText.muted, fontSize: homeFont.meta, marginBottom: 8 }} numberOfLines={1}>{challenge.hostName}</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: colors.foreground, fontSize: homeFont.title, fontWeight: "bold" }}>
              {challenge.currentValue}
              <Text style={{ fontSize: homeFont.meta, color: homeText.muted }}> / {challenge.goalValue}{unit}</Text>
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: homeUI.progressBar, borderRadius: 3, overflow: "hidden" }}>
            <LinearGradient
              colors={homeGradient.pinkPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: "100%", width: `${progress}%`, borderRadius: 3 }}
            />
          </View>
          <Text style={{ color: homeText.muted, fontSize: homeFont.meta, marginTop: 4 }}>
            あと{remaining}{unit}で目標達成！
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {!isDateUndecided && <Countdown targetDate={challenge.eventDate} compact />}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="event" size={12} color={homeText.accent} />
            <Text style={{ color: homeText.accent, fontSize: homeFont.meta, marginLeft: 2 }}>{formattedDate}</Text>
          </View>
        </View>
      </View>
    </AnimatedCard>
  );
}
