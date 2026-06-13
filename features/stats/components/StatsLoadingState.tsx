/**
 * StatsLoadingState Component
 * 統計画面のローディング状態を表示
 * 15秒以上かかる場合はタイムアウトUIを表示
 */

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";

interface StatsLoadingStateProps {
  /** ロードタイムアウト時の再試行 */
  onRetry?: () => void;
}

export function StatsLoadingState({ onRetry }: StatsLoadingStateProps) {
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (loadingTimedOut) return;
    const t = setTimeout(() => setLoadingTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, [loadingTimedOut]);

  if (loadingTimedOut && onRetry) {
    return (
      <ScreenContainer className="flex-1 justify-center items-center px-8">
        <Text style={{ color: color.textPrimary, fontSize: 16, textAlign: "center", marginBottom: 8 }}>
          読み込みに時間がかかっています
        </Text>
        <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center", marginBottom: 20 }}>
          ネットワーク接続を確認して、もう一度お試しください
        </Text>
        <Pressable
          onPress={() => {
            setLoadingTimedOut(false);
            onRetry();
          }}
          style={({ pressed }) => [
            {
              backgroundColor: color.accentPrimary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>再試行</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={color.hostAccentLegacy} />
      <Text style={{ color: color.textMuted, marginTop: 16 }}>
        統計データを読み込み中...
      </Text>
    </ScreenContainer>
  );
}
