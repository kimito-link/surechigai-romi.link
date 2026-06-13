/**
 * ScreenLoadingState Component
 * 画面全体のローディング状態を表示する共通コンポーネント
 * 
 * 使用例:
 * ```tsx
 * if (isInitialLoading) {
 *   return <ScreenLoadingState message="データを読み込み中..." />;
 * }
 * ```
 */

import { Text, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";
import { commonCopy } from "@/constants/copy/common";

export interface ScreenLoadingStateProps {
  /** ローディングメッセージ（省略時はデフォルト） */
  message?: string;
  /** インジケーターの色（省略時はデフォルト） */
  indicatorColor?: string;
  /** サイズ（省略時は large） */
  size?: "small" | "large";
}

export function ScreenLoadingState({
  message = commonCopy.loading.loading,
  indicatorColor = color.hostAccentLegacy,
  size = "large",
}: ScreenLoadingStateProps) {
  return (
    <ScreenContainer className="flex-1 justify-center items-center">
      <ActivityIndicator size={size} color={indicatorColor} />
      <Text style={{ color: color.textMuted, marginTop: 16 }}>
        {message}
      </Text>
    </ScreenContainer>
  );
}
