/**
 * RefreshingIndicator Component
 * データ更新中の小さなインジケータ
 * v6.59: スケルトンローディング改善のため追加
 */

import { View, Text, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { palette } from "@/theme/tokens";

interface RefreshingIndicatorProps {
  isRefreshing: boolean;
}

/**
 * データ保持したまま裏で更新中の状態を表示
 * スケルトンではなく、小さなインジケータで表示
 */
export function RefreshingIndicator({ isRefreshing }: RefreshingIndicatorProps) {
  const colors = useColors();

  if (!isRefreshing) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 60,
        right: 16,
        zIndex: 1000,
        backgroundColor: colors.surface,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <ActivityIndicator size="small" color={colors.primary} />
      <Text
        style={{
          fontSize: 12,
          color: colors.muted,
          fontWeight: "500",
        }}
      >
        更新中…
      </Text>
    </View>
  );
}
