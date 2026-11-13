/**
 * Modal を閉じた直後に別の Modal を開くための待ち合わせ。
 *
 * ★iOS では、閉じている途中の Modal がある間に次の Modal を出そうとすると
 *   「presentation is in progress」で表示が捨てられ、押しても何も出ないように見える
 *   （2026-11-13 実機 555 でサイドバーのログアウトが無反応だったのと同じ原因）。
 *   iOS だけ、閉じるアニメーション（fade/slide 約300ms）が終わるのを待ってから開く。
 *   Android / Web は重ねて出せるので、そのまま開く。
 */
import { Platform } from "react-native";

export const IOS_MODAL_DISMISS_WAIT_MS = 450;

export function runAfterModalDismiss(open: () => void): void {
  if (Platform.OS === "ios") {
    setTimeout(open, IOS_MODAL_DISMISS_WAIT_MS);
    return;
  }
  open();
}
