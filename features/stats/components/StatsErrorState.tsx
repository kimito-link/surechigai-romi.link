/**
 * StatsErrorState Component
 * 統計画面のエラー状態を表示
 */

import { View, Text, Pressable } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";
import { RetryButton } from "@/components/ui/retry-button";

interface StatsErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

export function StatsErrorState({ errorMessage, onRetry }: StatsErrorStateProps) {
  return (
    <ScreenContainer className="p-6">
      <Text style={{ fontSize: 24, fontWeight: "bold", color: color.textWhite }}>
        統計ダッシュボード
      </Text>
      <View
        style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: `${color.danger}20`,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: color.danger,
        }}
      >
        <Text style={{ color: color.danger, fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
          エラーが発生しました
        </Text>
        <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 16 }}>
          {errorMessage}
        </Text>
        <RetryButton onPress={onRetry} />
      </View>
    </ScreenContainer>
  );
}
