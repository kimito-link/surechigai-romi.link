/**
 * modules/encounter/db/premium-queries.ts
 *
 * プレミアム権利のクエリ層。判定ロジック自体は core/premium-entitlement.ts。
 */
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import { premiumEntitlements } from "../../../drizzle/schema/index.js";
import {
  isPremiumActive,
  type PremiumEntitlementLike,
} from "../core/premium-entitlement.js";

type DB = PostgresJsDatabase<typeof schema>;

/** 1ユーザーの権利行を取得（無ければ null） */
export async function getPremiumEntitlement(
  db: DB,
  userId: number,
): Promise<PremiumEntitlementLike> {
  const rows = await db
    .select({
      status: premiumEntitlements.status,
      currentPeriodEnd: premiumEntitlements.currentPeriodEnd,
      willRenew: premiumEntitlements.willRenew,
      platform: premiumEntitlements.platform,
    })
    .from(premiumEntitlements)
    .where(eq(premiumEntitlements.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * プレミアムが有効か。
 *
 * **例外を投げない**。DB が落ちていても「無料」を返す（フェイルクローズ）。
 * 広告表示など通常導線から呼ぶので、ここで throw すると機能全体が巻き添えになる。
 */
export async function isUserPremium(db: DB, userId: number): Promise<boolean> {
  try {
    const entitlement = await getPremiumEntitlement(db, userId);
    return isPremiumActive(entitlement);
  } catch {
    return false;
  }
}

/** RevenueCat webhook からの upsert。userId 一意なので1行に集約される */
export async function upsertPremiumEntitlement(
  db: DB,
  params: {
    userId: number;
    rcAppUserId: string;
    status: string;
    productId: string;
    platform: string;
    currentPeriodEnd: Date;
    willRenew: boolean;
  },
): Promise<void> {
  await db
    .insert(premiumEntitlements)
    .values({
      userId: params.userId,
      rcAppUserId: params.rcAppUserId,
      status: params.status,
      productId: params.productId,
      platform: params.platform,
      currentPeriodEnd: params.currentPeriodEnd,
      willRenew: params.willRenew,
    })
    .onConflictDoUpdate({
      target: premiumEntitlements.userId,
      set: {
        rcAppUserId: params.rcAppUserId,
        status: params.status,
        productId: params.productId,
        platform: params.platform,
        currentPeriodEnd: params.currentPeriodEnd,
        willRenew: params.willRenew,
        updatedAt: new Date(),
      },
    });
}
