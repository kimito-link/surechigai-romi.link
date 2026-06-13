/**
 * セクションヘッダーコンポーネント
 * ホーム画面の各セクションのタイトル表示に使用（共通 SectionHeader のラッパー）
 */

import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SectionHeader as UISectionHeader } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { homeText } from "@/features/home/ui/theme/tokens";
import { typography } from "@/theme/tokens";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <UISectionHeader
      title={title}
      action={
        onSeeAll ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={onSeeAll}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}
          >
            <Text style={{ color: homeText.accent, fontSize: typography.fontSize.sm }}>すべて見る</Text>
            <MaterialIcons name="chevron-right" size={20} color={homeText.accent} />
          </Button>
        ) : undefined
      }
      style={{ marginHorizontal: 16, marginTop: 24, marginBottom: 8 }}
    />
  );
}
