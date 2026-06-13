/**
 * バッジセクションコンポーネント
 * マイページで獲得バッジを表示する
 */

import { View, Text } from "react-native";
import { SectionHeader, EmptyState } from "@/components/ui";
import { mypageUI, mypageText, mypageFont } from "../../ui/theme/tokens";
import { typography } from "@/theme/tokens";

interface Badge {
  id: number;
  badge?: {
    icon?: string;
    name?: string;
  };
}

interface BadgeSectionProps {
  badges: Badge[] | undefined;
}

export function BadgeSection({ badges }: BadgeSectionProps) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
      <SectionHeader title="獲得バッジ" />
      {badges && badges.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {badges.map((userBadge) => (
            <View
              key={userBadge.id}
              style={{
                backgroundColor: mypageUI.cardBg,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                width: 80,
                borderWidth: 1,
                borderColor: mypageUI.cardBorder,
              }}
            >
              <Text style={{ fontSize: mypageFont.display }}>{userBadge.badge?.icon || "🏅"}</Text>
              <Text style={{ color: mypageText.muted, fontSize: typography.fontSize.xs, marginTop: 4, textAlign: "center" }}>
                {userBadge.badge?.name || "バッジ"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="emoji-events"
          title="まだバッジを獲得していません"
          style={{ minHeight: 160, paddingVertical: 24 }}
        />
      )}
    </View>
  );
}
