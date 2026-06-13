/**
 * LoadingMoreIndicator Component
 * 無限スクロール中のインジケータ
 * v6.59: スケルトンローディング改善のため追加
 */

import { View, Text, ActivityIndicator } from "react-native";
import { commonCopy } from "@/constants/copy/common";
import { useColors } from "@/hooks/use-colors";

interface LoadingMoreIndicatorProps {
  isLoadingMore: boolean;
}

/**
 * リスト末尾で次のページを読み込み中の状態を表示
 */
export function LoadingMoreIndicator({ isLoadingMore }: LoadingMoreIndicatorProps) {
  const colors = useColors();

  if (!isLoadingMore) return null;

  return (
    <View
      style={{
        paddingVertical: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="small" color={colors.primary} />
      <Text
        style={{
          marginTop: 8,
          fontSize: 12,
          color: colors.muted,
          fontWeight: "500",
        }}
      >
        {commonCopy.loading.loading}
      </Text>
    </View>
  );
}
