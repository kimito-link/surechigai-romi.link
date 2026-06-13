import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * 統一されたハプティクスフィードバックユーティリティ
 * - プラットフォーム判定を自動で行う
 * - 一貫したフィードバック体験を提供
 */

const isNative = Platform.OS !== "web";

/**
 * 軽いタップフィードバック
 * 用途: ボタンタップ、リスト項目タップ
 */
export function lightTap() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * 中程度のタップフィードバック
 * 用途: トグル切り替え、スイッチ操作
 */
export function mediumTap() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/**
 * 重いタップフィードバック
 * 用途: 重要なアクション、確定操作
 */
export function heavyTap() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/**
 * 成功フィードバック
 * 用途: 操作完了、保存成功
 */
export function success() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/**
 * 警告フィードバック
 * 用途: 注意が必要な操作
 */
export function warning() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

/**
 * エラーフィードバック
 * 用途: エラー発生、操作失敗
 */
export function error() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

/**
 * 選択フィードバック
 * 用途: ピッカー選択、セグメント切り替え
 */
export function selection() {
  if (isNative) {
    Haptics.selectionAsync();
  }
}

export const haptics = {
  lightTap,
  mediumTap,
  heavyTap,
  success,
  warning,
  error,
  selection,
};
