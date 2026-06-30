/**
 * modules/encounter/api/zukan.ts
 *
 * zukan tRPC ルーター。
 * - zukan.myAreas: visitedAreas + すれ違い相手の prefecture 集計
 */

import { router, protectedProcedure, publicProcedure } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getEncounterPrefectures,
  getDistinctEncounterPartnerCount,
  getMyTrailLocations,
  getMyVisitedAreas,
  getEncounterUsersByPrefecture,
  getCreatorsByPrefecture,
  softDeleteLocation,
  setLocationVisibility,
} from "../db/queries.js";

export const zukanRouter = router({
  /**
   * 都道府県図鑑。
   * - 自分の訪問エリア（visitedAreas）の prefecture 集計
   * - すれ違い相手の出身 prefecture 集計
   */
  myAreas: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { visited: [], encounterPrefectures: [], encounterPartnerCount: 0 };

    const [visited, encounterPrefectures, encounterPartnerCount] = await Promise.all([
      getMyVisitedAreas(db, ctx.user.id),
      getEncounterPrefectures(db, ctx.user.id),
      getDistinctEncounterPartnerCount(db, ctx.user.id),
    ]);

    return { visited, encounterPrefectures, encounterPartnerCount };
  }),

  /**
   * 自分の正確な足あと。
   * lat/lng/accuracyM は本人の軌跡表示だけに使い、他ユーザーには公開しない。
   */
  myTrail: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { locations: [] };

      const locations = await getMyTrailLocations(db, ctx.user.id, input?.limit ?? 120);
      return { locations };
    }),

  /**
   * 自分の足あと1件を削除（ソフト削除）。
   */
  deleteLocation: protectedProcedure
    .input(z.object({ locationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      const result = await softDeleteLocation(db, ctx.user.id, input.locationId);
      if (!result.ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記録が見つかりません" });
      }
      return { ok: true };
    }),

  /**
   * 足あと1件の公開/非公開を切り替え。
   */
  setLocationVisibility: protectedProcedure
    .input(
      z.object({
        locationId: z.number().int().positive(),
        visibility: z.enum(["public", "private"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      const result = await setLocationVisibility(
        db,
        ctx.user.id,
        input.locationId,
        input.visibility,
      );
      if (!result.ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記録が見つかりません" });
      }
      return { ok: true, visibility: input.visibility };
    }),

  /**
   * 指定した都道府県のすれ違いユーザー一覧
   */
  encounterUsersByPrefecture: protectedProcedure
    .input(z.object({ prefecture: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { users: [] };

      const users = await getEncounterUsersByPrefecture(
        db,
        ctx.user.id,
        input.prefecture
      );
      return { users };
    }),

  /**
   * 指定都道府県に記録があるクリエイター一覧（公開・未ログインでも閲覧可）。
   */
  creatorsByPrefecture: publicProcedure
    .input(z.object({ prefecture: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { creators: [] };

      const viewerId = ctx.user && ctx.user.id > 0 ? ctx.user.id : undefined;
      const creators = await getCreatorsByPrefecture(db, input.prefecture, viewerId);
      return { creators };
    }),
});
