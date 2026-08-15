/**
 * 「新しいすれちがいが届いた」をアプリ内トーストで知らせる（UI は既存 Toast に委譲）。
 *
 * ★OS のプッシュ通知ではない理由（docs/place-context-and-sns-SPEC.md Q2）:
 *   ユーザーの要求は「近づいたら通知。ただし電池を消耗しない形で」。
 *   アプリを開いている間だけで良いと確定したため、
 *   - 位置取得を1つも増やさない（既存 presence.pulse の応答に相乗り）
 *   - 通知権限を要求しない（Play の権限申告に触れない）
 *   という形にした。前景でしか出ないので OS バナーは二重表示になる。
 *
 * ★useToast は ClerkRootProvider の内側でしか呼べない
 *   （外で呼ぶと "useToast must be used within a ToastProvider" で画面全体が落ちる。
 *    components/photo-import/photo-import-screen.tsx:154 に実障害の記録）。
 *   このコンポーネントは TabAuthenticatedExtras（認証済みタブ内）にのみ置くこと。
 */
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/atoms/toast";
import {
  subscribeUnopenedSummary,
  consumeNotifiableSummary,
} from "@/lib/encounter-notice";

/** トーストの表示時間。読み終わる前に消えないよう既定(3秒)より長くする */
const NOTICE_TOAST_DURATION_MS = 5000;

export function EncounterArrivalToast() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;

    // pulse が未開封サマリを載せてきたら、鳴らすべきか判定して出す。
    // 判定（同じすれ違いで鳴らさない・OFF なら出さない）は lib/encounter-notice.ts 側。
    const unsubscribe = subscribeUnopenedSummary((summary) => {
      void (async () => {
        const notifiable = await consumeNotifiableSummary(summary);
        if (!notifiable) return;

        // ToastContext は message/type/duration のみ受け取る（action は Provider を
        // 通っていない）。よってタップ導線は付けず、封筒のありかを文言で伝える。
        showToast(
          `新しいすれちがいが${notifiable.count}通届いています（ホームで開けます）`,
          "info",
          NOTICE_TOAST_DURATION_MS,
        );
      })();
    });

    return unsubscribe;
  }, [isAuthenticated, showToast]);

  return null;
}
