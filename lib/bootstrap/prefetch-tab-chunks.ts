import { scheduleAfterIdle, scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";

const PREFETCH_MODULES = [
  () => import("@/components/post/post-authenticated-screen"),
  () => import("@/components/events/events-authenticated-screen"),
  () => import("@/components/zukan/zukan-authenticated-screen"),
  () => import("@/components/mypage/mypage-authenticated-screen"),
  () => import("@/components/checkin/checkin-authenticated-screen"),
  () => import("@/components/map/map-authenticated-screen"),
  () => import("@/components/organisms/web-trail-map"),
  () => import("@/components/molecules/event-calendar"),
  () => import("@/components/molecules/envelope-pulse"),
  () => import("@/components/molecules/character-here"),
  () => import("@/lib/icons/material-icons.web").then((m) => {
    m.prefetchMaterialIconsFont?.();
  }),
] as const;

const GUEST_PREFETCH_MODULES = [
  () => import("@/components/events/events-guest-content"),
  () => import("@/components/providers/public-web-providers"),
] as const;

let heavyStarted = false;
let guestStarted = false;

function runPrefetch(modules: readonly (() => Promise<unknown>)[]): () => void {
  return scheduleAfterWindowLoad(() => {
    for (const load of modules) {
      void load().catch(() => {});
    }
  });
}

/** 認証済み Web: アイドル時に重いタブ chunk を先読み。 */
export function prefetchHeavyTabChunks(): () => void {
  if (heavyStarted || typeof window === "undefined") {
    return () => {};
  }
  heavyStarted = true;
  return runPrefetch(PREFETCH_MODULES);
}

/** `/events` 直リンク向け — idle 待ちせず guest 集まり chunk を先読み。 */
export function prefetchGuestEventsImmediate(): void {
  if (typeof window === "undefined") return;
  void import("@/components/events/events-guest-content").catch(() => {});
  void import("@/components/molecules/event-calendar").catch(() => {});
}

/** Guest Web: LCP 確定後 idle で tRPC / 集まり guest chunk を先読み。 */
export function prefetchGuestTabChunks(): () => void {
  if (guestStarted || typeof window === "undefined") {
    return () => {};
  }
  guestStarted = true;
  return scheduleAfterWindowLoad(() =>
    scheduleAfterIdle(
      () => {
        for (const load of GUEST_PREFETCH_MODULES) {
          void load().catch(() => {});
        }
      },
      { fallbackDelayMs: 2_000, timeoutMs: 5_000 },
    ),
  );
}
