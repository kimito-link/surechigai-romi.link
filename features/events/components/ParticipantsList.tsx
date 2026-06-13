/**
 * 参加者リストコンポーネント
 * 一緒に参加している人を横スクロールで表示
 */
import { View, Text, ScrollView } from "react-native";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { Button } from "@/components/ui/button";
import { eventText, eventFont, eventUI } from "@/features/events/ui/theme/tokens";
import { OptimizedAvatar } from "@/components/molecules/optimized-image";
import { formatParticipationDate } from "@/lib/format-date";
import type { Participation, FanProfile } from "@/types/participation";

interface ParticipantsListProps {
  /** 参加者リスト */
  participations: Participation[];
  /** ファンプロフィールをタップした時のコールバック */
  onFanPress?: (fan: FanProfile) => void;
  /** 表示する最大人数（デフォルト: 10） */
  maxDisplay?: number;
}

export function ParticipantsList({
  participations,
  onFanPress,
  maxDisplay = 10,
}: ParticipantsListProps) {
  const colors = useColors();
  

  // 匿名でない参加者のみ表示
  const visibleParticipants = participations
    .filter((p) => !p.isAnonymous && p.userId)
    .slice(0, maxDisplay);

  if (visibleParticipants.length === 0) return null;

  const totalNonAnonymous = participations.filter((p) => !p.isAnonymous && p.userId).length;

  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
        一緒に参加している人 ({participations.length}人)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {visibleParticipants.map((p) => (
            <Button
              key={p.id}
              variant="ghost"
              onPress={() => {
                if (onFanPress && p.twitterId && p.username) {
                  onFanPress({
                    twitterId: p.twitterId,
                    username: p.username,
                    displayName: p.displayName,
                    profileImage: p.profileImage || undefined,
                  });
                } else if (p.userId) {
                  navigate.toProfile(p.userId);
                }
              }}
              style={{ alignItems: "center", width: 70, paddingHorizontal: 0, paddingVertical: 4 }}
            >
              <View>
                <OptimizedAvatar
                  source={p.profileImage ? { uri: p.profileImage } : undefined}
                  size={50}
                  fallbackColor={eventUI.fallback}
                  fallbackText={p.displayName.charAt(0)}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    backgroundColor: eventUI.badge,
                    borderRadius: 8,
                    padding: 2,
                  }}
                >
                  <MaterialIcons name="info" size={10} color="#fff" />
                </View>
              </View>
              <Text
                style={{ color: colors.foreground, fontSize: 12, marginTop: 4, textAlign: "center" }}
                numberOfLines={1}
              >
                {p.displayName}
              </Text>
              <Text style={{ color: eventText.secondary, fontSize: eventFont.tiny, marginTop: 2, textAlign: "center" }}>
                {formatParticipationDate(p.createdAt)}に参加
              </Text>
              {p.followersCount && p.followersCount > 0 && (
                <Text style={{ color: eventText.accent, fontSize: eventFont.tiny, fontWeight: "bold" }} numberOfLines={1}>
                  {p.followersCount >= 10000
                    ? `${(p.followersCount / 10000).toFixed(1)}万`
                    : p.followersCount.toLocaleString()}
                  人
                </Text>
              )}
              {p.username && (
                <Text style={{ color: eventText.secondary, fontSize: eventFont.tiny }} numberOfLines={1}>
                  @{p.username}
                </Text>
              )}
            </Button>
          ))}
          {totalNonAnonymous > maxDisplay && (
            <View style={{ alignItems: "center", justifyContent: "center", width: 50 }}>
              <Text style={{ color: eventText.secondary, fontSize: eventFont.meta }}>+{totalNonAnonymous - maxDisplay}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
