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
    utils.zukan.myTrail.prefetch({ limit: 1 }),
  ],
  events: (utils) => [
    utils.event.listUpcoming.prefetch({ limit: 100 }),
    utils.event.listLive.prefetch(undefined),
  ],
  zukan: (utils) => [
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
  ],
};

/** ログイン直後に全タブで使うコアデータ */
export function prefetchCoreAuthenticatedData(utils: TrpcUtils): void {
  void Promise.allSettled([
    utils.dashboard.mySignal.prefetch(undefined),
    utils.encounter.list.prefetch({}),
    utils.zukan.myTrail.prefetch({ limit: 1 }),
    utils.zukan.myAreas.prefetch(undefined),
    utils.settings.get.prefetch(undefined),
  ]);
}

export function prefetchTabData(utils: TrpcUtils, tab: TabPrefetchKey): void {
  void Promise.allSettled(TAB_PREFETCH[tab](utils));
}
