/**
 * ダッシュボード / My Signal サマリー API
 */

import { protectedProcedure, router } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { getMySignalSummary } from "../db/dashboard-queries.js";

export const dashboardRouter = router({
  /** マイページ・コンテキストバー用の一括サマリー */
  mySignal: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        trailCount: 0,
        latestPlaceLabel: null,
        latestRecordedAt: null,
        latestLocation: null,
        encounterPartnerCount: 0,
        unopenedCount: 0,
        visitedPrefectureCount: 0,
        visitedAreaCount: 0,
        checkedInToday: false,
        upcomingParticipationCount: 0,
        hostEvents: [],
      };
    }
    return getMySignalSummary(db, ctx.user.id);
  }),
});
