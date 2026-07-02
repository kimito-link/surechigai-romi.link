/**
 * 認証後・タブ遷移前に tRPC データを先読みする。
 */
import type { trpc } from "@/lib/trpc";

export type TrpcUtils = ReturnType<typeof trpc.useUtils>;

export type TabPrefetchKey = "post" | "checkin" | "events" | "zukan" | "map" | "mypage";

const TAB_PREFETCH: Record<TabPrefetchKey, (utils: TrpcUtils) => Promise<unknown>[]> = {
  post: (utils) => [
    utils.encounter.list.prefetch({}),
    utils.presence.list.prefetch(undefined),
    utils.zukan.myTrail.prefetch({ limit: 1 }),
  ],
  checkin: (utils) => [
    utils.settings.get.prefetch(undefined),
    utils.zukan.myTrail.prefetch({ limit: 10 }),
  ],
  events: (utils) => [
    utils.event.listUpcoming.prefetch({ limit: 100 }),
    utils.event.listLive.prefetch(undefined),
  ],
  zukan: (utils) => [
    utils.zukan.activePrefectures.prefetch(undefined),
    utils.zukan.myAreas.prefetch(undefined),
    utils.zukan.myTrail.prefetch({ limit: 500 }),
  ],
  map: (utils) => [
    utils.zukan.myAreas.prefetch(undefined),
    utils.zukan.myTrail.prefetch({ limit: 120 }),
  ],
  mypage: (utils) => [
    utils.dashboard.mySignal.prefetch(undefined),
    utils.settings.get.prefetch(undefined),
    utils.eventParticipation.myUpcoming.prefetch(undefined),
    utils.zukan.activePrefectures.prefetch(undefined),
  ],
};

/** ログイン直後に全タブで使うコアデータ */
export function prefetchCoreAuthenticatedData(utils: TrpcUtils): void {
  void Promise.allSettled([
    utils.dashboard.mySignal.prefetch(undefined),
    utils.encounter.list.prefetch({}),
    utils.zukan.myTrail.prefetch({ limit: 1 }),
    utils.zukan.myAreas.prefetch(undefined),
    utils.zukan.activePrefectures.prefetch(undefined),
    utils.settings.get.prefetch(undefined),
    utils.eventParticipation.myUpcoming.prefetch(undefined),
    utils.event.listMine.prefetch(undefined),
  ]);
}

const loadAuthenticatedScreens = () => import("@/components/tabs/authenticated-screen-funnel");

const TAB_CHUNK_LOADERS: Record<TabPrefetchKey, () => Promise<unknown>> = {
  post: loadAuthenticatedScreens,
  checkin: loadAuthenticatedScreens,
  events: loadAuthenticatedScreens,
  zukan: loadAuthenticatedScreens,
  map: loadAuthenticatedScreens,
  mypage: loadAuthenticatedScreens,
};

/** タブ本体 JS chunk を先読み（lazy screen の ChunkFallback を短縮） */
export function prefetchTabChunk(tab: TabPrefetchKey): void {
  void TAB_CHUNK_LOADERS[tab]();
}

export function prefetchTabData(utils: TrpcUtils, tab: TabPrefetchKey): void {
  prefetchTabChunk(tab);
  void Promise.allSettled(TAB_PREFETCH[tab](utils));
}

const ALL_TAB_KEYS: TabPrefetchKey[] = ["post", "checkin", "events", "zukan", "map", "mypage"];

/** ログイン直後のアイドル時間に全タブ chunk を温める */
export function prefetchAllTabChunksIdle(): void {
  const run = () => {
    for (const tab of ALL_TAB_KEYS) prefetchTabChunk(tab);
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 4_000 });
  } else {
    setTimeout(run, 1_500);
  }
}
