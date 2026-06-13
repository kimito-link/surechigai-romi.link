/**
 * ScreenErrorState Component
 * 画面全体のエラー状態を表示する共通コンポーネント
 * 
 * 使用例:
 * ```tsx
 * if (isError) {
 *   return (
 *     <ScreenErrorState 
 *       errorMessage={error?.message || "データを読み込めませんでした"}
 *       onRetry={refetch}
 *     />
 *   );
 * }
 * ```
 */

import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color, palette } from "@/theme/tokens";
import { RetryButton } from "./retry-button";

export interface ScreenErrorStateProps {
  /** エラーメッセージ */
  errorMessage: string;
  /** 再試行ハンドラー */
  onRetry: () => void;
  /** タイトル（省略時はデフォルト） */
  title?: string;
}

export function ScreenErrorState({
  errorMessage,
  onRetry,
  title = "エラーが発生しました",
}: ScreenErrorStateProps) {
  return (
    <ScreenContainer className="p-6">
      <Text style={{ fontSize: 24, fontWeight: "bold", color: color.textWhite }}>
        {title}
      </Text>
      <View
        style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: palette.red500 + "20",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: color.danger,
        }}
      >
        <Text style={{ color: color.danger, fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
          {title}
        </Text>
        <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 16 }}>
          {errorMessage}
        </Text>
        <RetryButton onPress={onRetry} />
      </View>
    </ScreenContainer>
  );
}
