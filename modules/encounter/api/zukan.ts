/**
 * modules/encounter/api/zukan.ts
 *
 * zukan tRPC ルーター。
 * - zukan.myAreas: visitedAreas + すれ違い相手の prefecture 集計
 */

import { router, protectedProcedure } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { z } from "zod";
import {
  getEncounterPrefectures,
  getMyTrailLocations,
  getMyVisitedAreas,
} from "../db/queries.js";

export const zukanRouter = router({
  /**
   * 都道府県図鑑。
   * - 自分の訪問エリア（visitedAreas）の prefecture 集計
   * - すれ違い相手の出身 prefecture 集計
   */
  myAreas: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { visited: [], encounterPrefectures: [] };

    const [visited, encounterPrefectures] = await Promise.all([
      getMyVisitedAreas(db, ctx.user.id),
      getEncounterPrefectures(db, ctx.user.id),
    ]);

    return { visited, encounterPrefectures };
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
});
