/**
 * modules/encounter/api/zukan.ts
 *
 * zukan tRPC ルーター。
 * - zukan.myAreas: visitedAreas + すれ違い相手の prefecture 集計
 */

import { router, protectedProcedure } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { getMyVisitedAreas, getEncounterPrefectures } from "../db/queries.js";

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
});
