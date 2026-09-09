/**
 * チャンク取得失敗を **window レベル**（Promise の unhandledrejection）で捕まえ、
 * 一度だけ自動リロードして復帰する。
 *
 * ★判定と回復のロジックは持たない。正本は lib/chunk-load-recovery.ts。
 *   ここは「どこで捕まえるか」だけを担当する。
 *
 * ★なぜ分けるか（2026-09-06 に実際に踏んだ）:
 *   以前ここには判定の正規表現が独自に書かれており、正本には有る `Loading module` を
 *   **拾えなかった**。本番で出ていたエラーがまさに「Loading module ... failed」で、
 *   正本を使う ErrorBoundary 経由では拾えても、こちらの経路では素通りしていた。
 *   同じ判定を2箇所に書くと、片方だけ古くなってこうなる。
 */

import {
  clearChunkReloadFlag,
  isChunkLoadError,
  tryRecoverFromChunkError,
} from "@/lib/chunk-load-recovery";

export function setupChunkRecover(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    tryRecoverFromChunkError(event.reason);
  });

  // 正常に読み込めたら印を消す（次にチャンク落ちした時にまた1回試せるように）
  window.addEventListener("load", () => {
    clearChunkReloadFlag();
  });
}
