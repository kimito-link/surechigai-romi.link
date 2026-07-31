/**
 * server/routers/premium.ts
 *
 * プレミアム（月額サブスクリプション）の状態取得とデータエクスポート。
 * 設計は docs/monetization-DESIGN.md。
 *
 * 購入処理そのものはここには無い（RevenueCat のネイティブSDKがクライアントで行い、
 * 結果は webhook 経由で premium_entitlements に反映される）。
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db/connection.js";
import {
  getPremiumEntitlement,
  isUserPremium,
} from "../../modules/encounter/db/premium-queries.js";
import { isPremiumActive } from "../../modules/encounter/core/premium-entitlement.js";
import { getMyTrailLocations } from "../../modules/encounter/db/queries.js";
import {
  buildTrailGeoJson,
  buildTrailGpx,
} from "../../modules/encounter/core/trail-export.js";

export const premiumRouter = router({
  /**
   * 自分のプレミアム状態。
   * DB未接続でも throw せず「無料」を返す（フェイルクローズ）。
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return { isPremium: false, currentPeriodEnd: null, willRenew: false, platform: null };
    }
    const entitlement = await getPremiumEntitlement(db, ctx.user.id).catch(() => null);
    const row = entitlement as
      | { currentPeriodEnd?: Date | null; willRenew?: boolean; platform?: string }
      | null;
    return {
      isPremium: isPremiumActive(entitlement),
      currentPeriodEnd: row?.currentPeriodEnd ?? null,
      willRenew: row?.willRenew ?? false,
      platform: row?.platform ?? null,
    };
  }),

  /**
   * 足あとのエクスポート（プレミアム機能）。
   *
   * 審査でこの機能を主デモにする想定。広告非表示は新規ユーザー保護により
   * 審査員のアカウントでは差分が見えないため（docs/monetization-DESIGN.md E-1）。
   */
  exportTrail: protectedProcedure
    .input(z.object({ format: z.enum(["gpx", "geojson"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      }

      // サーバー側のゲートが正。クライアントの表示は飾りに過ぎない
      if (!(await isUserPremium(db, ctx.user.id))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この機能はプレミアムでご利用いただけます",
        });
      }

      const locations = await getMyTrailLocations(db, ctx.user.id, 500);
      const content =
        input.format === "gpx"
          ? buildTrailGpx(locations)
          : buildTrailGeoJson(locations);

      return {
        format: input.format,
        filename: `surechigai-trail.${input.format === "gpx" ? "gpx" : "geojson"}`,
        content,
        count: locations.length,
      };
    }),
});
