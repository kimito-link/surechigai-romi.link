/**
 * modules/encounter/core/premium-entitlement.ts
 *
 * プレミアム権利の判定（純粋関数）。DB アクセスは呼び出し側が行う。
 *
 * 設計は docs/monetization-DESIGN.md。最重要はフェイルクローズ:
 * 行が無い・期限切れ・状態が不正・判定できない、のいずれも「無料」に倒す。
 * sponsor_config は行が無いとき enabled:true にフォールバックするフェイルオープンで、
 * 新規環境でキルスイッチが効かない事故を抱えている。ここは同じ轍を踏まない。
 */

/** 判定に必要な最小の形。DB 行でもAPIレスポンスでも受けられるようにしている */
export type PremiumEntitlementLike = {
  status?: string | null;
  currentPeriodEnd?: Date | string | null;
} | null | undefined;

/**
 * プレミアムが有効か。
 *
 * 有効なのは「行があり、status が active で、currentPeriodEnd が未来」のときだけ。
 * それ以外（行なし・expired・revoked・期限切れ・壊れた日付）はすべて無料。
 */
export function isPremiumActive(
  entitlement: PremiumEntitlementLike,
  now: Date = new Date(),
): boolean {
  if (!entitlement) return false;
  if (entitlement.status !== "active") return false;

  const end = entitlement.currentPeriodEnd;
  if (!end) return false;
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(endDate.getTime())) return false;

  return endDate.getTime() > now.getTime();
}

/**
 * RevenueCat の webhook イベント種別を、こちらの状態に畳む。
 * 未知のイベントは null を返し、呼び出し側は何もしない（勝手に有効化しない）。
 */
export function resolveStatusFromWebhookEvent(
  eventType: string,
): { status: "active" | "expired" | "revoked"; willRenew?: boolean } | null {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return { status: "active", willRenew: true };
    case "CANCELLATION":
      // 解約予約。期間終了までは有効なので status は active のまま
      return { status: "active", willRenew: false };
    case "EXPIRATION":
      return { status: "expired", willRenew: false };
    case "REFUND":
    case "SUBSCRIPTION_PAUSED":
      return { status: "revoked", willRenew: false };
    default:
      return null;
  }
}

/** RevenueCat に渡す app_user_id。認証基盤(Clerk)のIDではなく自前の users.id を使う */
export function buildRcAppUserId(userId: number): string {
  return `user_${userId}`;
}

/** buildRcAppUserId の逆。想定外の形式は null */
export function parseRcAppUserId(rcAppUserId: string): number | null {
  const m = /^user_(\d+)$/.exec(rcAppUserId.trim());
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
