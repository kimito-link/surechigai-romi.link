/**
 * server/routers/prefectures.ts
 * 
 * 地域統計関連のルーター
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const prefecturesRouter = router({
  // 地域ランキング
  ranking: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getPrefectureRanking(input.challengeId);
    }),

  // 地域フィルター付き参加者一覧
  participations: publicProcedure
    .input(z.object({ challengeId: z.number(), prefecture: z.string() }))
    .query(async ({ input }) => {
      return db.getParticipationsByPrefectureFilter(input.challengeId, input.prefecture);
    }),
});
