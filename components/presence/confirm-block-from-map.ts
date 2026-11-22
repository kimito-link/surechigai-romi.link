/**
 * 地図（レーダー・みんなの居場所）上の他の人からブロックする確認。
 * 2026-11-21 build 556 却下 5.1.2(i)「地図に位置が出る他のユーザーをブロックできる仕組み」。
 * ★Modal ではなく Alert にする（iOS で Modal 連鎖が無反応になった前科: lib/after-modal-dismiss.ts）。
 */
import { Alert, Platform } from "react-native";

export function confirmBlockFromMap(userId: number, name: string, onBlock: (userId: number) => void) {
  const title = `${name} さん`;
  const message =
    "いま地図に出ている人です。ブロックすると、お互いの地図・すれ違い・集まりに表示されなくなります。";
  if (Platform.OS === "web") {
    // react-native-web の Alert.alert は何もしないので、Web は確認ダイアログで代用する
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}\n\nブロックしますか？`)) {
      onBlock(userId);
    }
    return;
  }
  Alert.alert(title, message, [
    { text: "キャンセル", style: "cancel" },
    { text: "ブロックする", style: "destructive", onPress: () => onBlock(userId) },
  ]);
}
