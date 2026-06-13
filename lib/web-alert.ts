/**
 * Web対応のアラート関数
 * React NativeのAlert.alertはWebでは動作しないため、
 * Webではwindow.alertを使用し、ネイティブではAlert.alertを使用する
 */

import { Alert, Platform } from "react-native";

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/**
 * Web対応のアラートを表示
 * @param title アラートのタイトル
 * @param message アラートのメッセージ
 * @param buttons ボタンの配列（Webでは最初のボタンのonPressのみ実行）
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === "web") {
    // Webではwindow.alertを使用
    const fullMessage = message ? `${title}\n\n${message}` : title;
    window.alert(fullMessage);
    
    // 最初のボタンのonPressを実行（OKボタン相当）
    if (buttons && buttons.length > 0) {
      const okButton = buttons.find(b => b.text === "OK" || b.style !== "cancel") || buttons[0];
      if (okButton?.onPress) {
        okButton.onPress();
      }
    }
  } else {
    // ネイティブではAlert.alertを使用
    Alert.alert(title, message, buttons);
  }
}

/**
 * Web対応の確認ダイアログを表示
 * @param title ダイアログのタイトル
 * @param message ダイアログのメッセージ
 * @param onConfirm 確認時のコールバック
 * @param onCancel キャンセル時のコールバック
 */
export function showConfirm(
  title: string,
  message?: string,
  onConfirm?: () => void,
  onCancel?: () => void
): void {
  if (Platform.OS === "web") {
    const fullMessage = message ? `${title}\n\n${message}` : title;
    const result = window.confirm(fullMessage);
    if (result) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: "キャンセル", style: "cancel", onPress: onCancel },
      { text: "OK", onPress: onConfirm },
    ]);
  }
}
