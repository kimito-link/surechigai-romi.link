/**
 * テーマ対応のスタイルユーティリティ
 * StyleSheet内でテーマ色を使用するためのフック
 */

import { useMemo } from "react";
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { useColors } from "./use-colors";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * テーマ対応のスタイルを生成するフック
 * 
 * @example
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *   },
 *   text: {
 *     color: colors.foreground,
 *   },
 * }));
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  styleFactory: (colors: ReturnType<typeof useColors>) => T
): T {
  const colors = useColors();
  
  return useMemo(() => {
    return StyleSheet.create(styleFactory(colors));
  }, [colors, styleFactory]);
}

/**
 * 共通のテーマ対応スタイル
 */
export function useCommonThemedStyles() {
  const colors = useColors();
  
  return useMemo(() => StyleSheet.create({
    // 背景
    screenBackground: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surfaceBackground: {
      backgroundColor: colors.surface,
    },
    
    // テキスト
    primaryText: {
      color: colors.foreground,
    },
    secondaryText: {
      color: colors.muted,
    },
    
    // ボーダー
    borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    borderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    
    // カード
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    // 入力フィールド
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.foreground,
      padding: 12,
    },
    
    // ボタン
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: "center" as const,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      alignItems: "center" as const,
    },
  }), [colors]);
}
