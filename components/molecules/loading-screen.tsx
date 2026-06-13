import { View, Text, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";
import { BlinkingLink } from "@/components/atoms/blinking-character";

interface LoadingScreenProps {
  message?: string;
  showCharacter?: boolean;
  size?: "small" | "medium" | "large";
  characterVariant?: "normalClosed" | "normalOpen" | "smileClosed" | "smileOpen";
}

/**
 * 汎用ローディング画面コンポーネント
 * キャラクター付きのローディング表示
 * 
 * 使用例:
 * ```tsx
 * {isLoading && <LoadingScreen message="読み込み中..." />}
 * ```
 */
export function LoadingScreen({
  message = "読み込み中...",
  showCharacter = true,
  size = "medium",
  characterVariant = "normalClosed",
}: LoadingScreenProps) {
  const characterSize = size === "small" ? 60 : size === "medium" ? 80 : 100;
  const indicatorSize = size === "small" ? "small" : "large";
  const fontSize = size === "small" ? 12 : size === "medium" ? 14 : 16;

  return (
    <View className="flex-1 items-center justify-center py-8">
      {showCharacter && (
        <BlinkingLink
          variant={characterVariant}
          size={characterSize}
          blinkInterval={2500}
          style={{ marginBottom: 16 }}
        />
      )}
      <ActivityIndicator size={indicatorSize} color={color.accentPrimary} />
      <Text 
        style={{ 
          color: color.textMuted, 
          fontSize, 
          marginTop: 12,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}

/**
 * インラインローディングインジケーター（小さいスペース用）
 */
export function LoadingIndicator({
  message,
  indicatorColor = color.accentPrimary,
}: {
  message?: string;
  indicatorColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-center py-4">
      <ActivityIndicator size="small" color={indicatorColor} />
      {message && (
        <Text style={{ color: color.textMuted, fontSize: 12, marginLeft: 8 }}>
          {message}
        </Text>
      )}
    </View>
  );
}
