import type { TrpcUtils } from "@/lib/bootstrap/prefetch-tab-data";

/** 主催操作・参加表明後に一覧/マイページを同期する。 */
export function invalidateEventListQueries(utils: TrpcUtils): void {
  void utils.event.listMine.invalidate();
  void utils.event.listUpcoming.invalidate();
  void utils.event.listLive.invalidate();
  void utils.dashboard.mySignal.invalidate();
}
