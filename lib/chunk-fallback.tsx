import { View, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";

/** lazy-heavy-components とは別 chunk（index 初回 eval を軽くする）。 */
export function ChunkFallback({ minHeight = 220 }: { minHeight?: number }) {
  return (
    <View style={{ minHeight, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={color.accentPrimary} size="large" />
    </View>
  );
}

/** @deprecated MapChunkFallback の別名 */
export const MapChunkFallback = ChunkFallback;
