import { registerServiceWorker } from "@/lib/service-worker";
import { setupChunkRecover } from "@/lib/pwa/chunk-recover";
import { initSentry } from "@/lib/sentry";
import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";
import { loadDeferredWebEntrySideEffects } from "@/lib/bootstrap/web-entry-deferred";

let started = false;

/**
 * 非クリティカルな Web 初期化を load 後に遅延（kimito FontLoader と同じ帯域譲渡思想）。
 */
export function startDeferredWebBootstrap(): () => void {
  if (started || typeof window === "undefined") {
    return () => {};
  }
  started = true;

  return scheduleAfterWindowLoad(() => {
    loadDeferredWebEntrySideEffects();
    registerServiceWorker();
    setupChunkRecover();
    window.setTimeout(() => {
      void initSentry();
    }, 2000);
  });
}
