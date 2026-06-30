import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";

const PREFETCH_MODULES = [
  () => import("@/components/checkin/checkin-authenticated-screen"),
  () => import("@/components/organisms/web-trail-map"),
  () => import("@/components/molecules/event-calendar"),
] as const;

let started = false;

/** アイドル時に重いタブ chunk を先読み（初回タップの体感を改善）。 */
export function prefetchHeavyTabChunks(): () => void {
  if (started || typeof window === "undefined") {
    return () => {};
  }
  started = true;

  return scheduleAfterWindowLoad(() => {
    for (const load of PREFETCH_MODULES) {
      void load().catch(() => {});
    }
  });
}
