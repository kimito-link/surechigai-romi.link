/**
 * MapErrorFallback - 地図コンポーネント専用のエラーフォールバックUI
 * 
 * 地図の描画に失敗した場合に表示するフォールバックUI
 */

import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { RetryButton } from "./retry-button";
import type { FallbackProps } from "./error-boundary";

export interface MapErrorFallbackProps extends FallbackProps {
  /** 地図の種類（表示用） */
  mapType?: "heatmap" | "block" | "deformed" | "standard";
  /** コンテナの高さ */
  height?: number;
}

const MAP_TYPE_LABELS: Record<string, string> = {
  heatmap: "ヒートマップ",
  block: "ブロック地図",
  deformed: "デフォルメ地図",
  standard: "日本地図",
};

export function MapErrorFallback({
  error,
  resetErrorBoundary,
  mapType = "standard",
  height = 300,
}: MapErrorFallbackProps) {
  const label = MAP_TYPE_LABELS[mapType] || "地図";

  return (
    <View style={[styles.container, { minHeight: height }]}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="map" size={32} color={color.textSubtle} />
        <View style={styles.errorBadge}>
          <MaterialIcons name="error" size={16} color={color.danger} />
        </View>
      </View>

      <Text style={styles.title}>{label}を読み込めませんでした</Text>

      <Text style={styles.message} numberOfLines={2}>
        {error.message || "地図データの取得中にエラーが発生しました"}
      </Text>

      <RetryButton onPress={resetErrorBoundary} variant="reload" size="sm" />

      <Text style={styles.hint}>
        問題が続く場合は、アプリを再起動してください
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: color.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    borderStyle: "dashed",
    gap: 12,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 4,
  },
  errorBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: color.surface,
    borderRadius: 10,
    padding: 2,
  },
  title: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 260,
  },
  hint: {
    color: color.textSubtle,
    fontSize: 12,
    marginTop: 4,
  },
});

export default MapErrorFallback;
