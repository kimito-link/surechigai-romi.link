import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";

const PREFETCH_MODULES = [
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
