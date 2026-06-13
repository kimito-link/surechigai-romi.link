import { RefreshControl, RefreshControlProps } from "react-native";
import { color } from "@/theme/tokens";
import { haptics } from "@/lib/haptics";
import { useState, useCallback } from "react";

interface EnhancedRefreshControlProps extends Omit<RefreshControlProps, "onRefresh" | "refreshing"> {
  onRefresh: () => Promise<void>;
  /** リフレッシュ完了時にハプティクスフィードバックを出すか（デフォルト: true） */
  hapticOnComplete?: boolean;
}

/**
 * 改善されたプルトゥリフレッシュコンポーネント
 * - リフレッシュ開始時と完了時にハプティクスフィードバック
 * - 自動的なローディング状態管理
 * - ブランドカラー対応
 */
export function EnhancedRefreshControl({
  onRefresh,
  hapticOnComplete = true,
  ...props
}: EnhancedRefreshControlProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    // リフレッシュ開始時のフィードバック
    haptics.mediumTap();
    
    setRefreshing(true);
    
    try {
      await onRefresh();
      
      // リフレッシュ完了時のフィードバック
      if (hapticOnComplete) {
        haptics.success();
      }
    } catch {
      // エラー時のフィードバック
      haptics.error();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, hapticOnComplete]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={color.hostAccentLegacy}
      colors={[color.hostAccentLegacy]} // Android用
      progressBackgroundColor={color.surface} // Android用
      {...props}
    />
  );
}

/**
 * シンプルなリフレッシュコントロール（状態管理は外部）
 */
export function SimpleRefreshControl({
  refreshing,
  onRefresh,
  tintColor = color.hostAccentLegacy,
  colors = [color.hostAccentLegacy],
  progressBackgroundColor = color.surface,
  ...props
}: RefreshControlProps) {
  const handleRefresh = useCallback(() => {
    haptics.mediumTap();
    onRefresh?.();
  }, [onRefresh]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={tintColor}
      colors={colors}
      progressBackgroundColor={progressBackgroundColor}
      {...props}
    />
  );
}
