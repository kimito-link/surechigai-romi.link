/**
 * StatsEmptyState Component
 * 統計データが存在しない場合の状態を表示
 */

import { Text } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";

interface StatsEmptyStateProps {
  message?: string;
}

export function StatsEmptyState({ message }: StatsEmptyStateProps) {
  const displayMessage = message ?? "統計データはまだありません。";

  return (
    <ScreenContainer className="p-6">
      <Text style={{ fontSize: 24, fontWeight: "bold", color: color.textWhite }}>
        統計ダッシュボード
      </Text>
      <Text style={{ color: color.textMuted, marginTop: 16 }}>
        {displayMessage}
      </Text>
    </ScreenContainer>
  );
}
