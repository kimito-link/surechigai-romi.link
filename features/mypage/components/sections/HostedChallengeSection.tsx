/**
 * 主催チャレンジセクションコンポーネント
 * マイページで主催しているチャレンジ一覧を表示する
 */

import { View, Text, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { SectionHeader, EmptyState } from "@/components/ui";
import { mypageUI, mypageText } from "../../ui/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { typography } from "@/theme/tokens";

interface Challenge {
  id: number;
  title: string;
  currentCount?: number;
  goalCount?: number;
}

interface HostedChallengeSectionProps {
  challenges: Challenge[] | undefined;
  onChallengePress: (challengeId: number) => void;
}

export function HostedChallengeSection({ challenges, onChallengePress }: HostedChallengeSectionProps) {
  const colors = useColors();

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 100 }}>
      <SectionHeader title="主催チャレンジ" />
      {challenges && challenges.length > 0 ? (
        <View style={{ gap: 12 }}>
          {challenges.map((challenge) => (
            <Pressable
              key={challenge.id}
              onPress={() => onChallengePress(challenge.id)}
              style={{
                backgroundColor: mypageUI.cardBg,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: mypageUI.hostBorder,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <View style={{ backgroundColor: mypageUI.hostBadgeBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                      <Text style={{ color: colors.foreground, fontSize: typography.fontSize.xs, fontWeight: "bold" }}>主催</Text>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: typography.fontSize.base, fontWeight: "bold" }}>
                      {challenge.title}
                    </Text>
                  </View>
                  <Text style={{ color: mypageText.muted, fontSize: typography.fontSize.xs }}>
                    {challenge.currentCount || 0} / {challenge.goalCount || 0} 人
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={mypageText.muted} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="flag"
          title="まだチャレンジを主催していません"
          style={{ minHeight: 160, paddingVertical: 24 }}
        />
      )}
    </View>
  );
}
