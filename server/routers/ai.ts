/**
 * server/routers/ai.ts
 * 
 * AI向け最適化API（1ホップ取得・非正規化サマリー）
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const aiRouter = router({
  // AI向けチャレンジ詳細取得（JOINなし・1ホップ）
  getChallenge: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getChallengeForAI(input.id);
    }),

  // AI向け検索（意図タグベース）
  searchByTags: publicProcedure
    .input(z.object({
      tags: z.array(z.string()),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return db.searchChallengesForAI(input.tags, input.limit || 20);
    }),

  // チャレンジサマリーを手動更新
  refreshSummary: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ input }) => {
      await db.refreshChallengeSummary(input.challengeId);
      return { success: true };
    }),

  // 全チャレンジのサマリーを一括更新（管理者向け）
  refreshAllSummaries: protectedProcedure
    .mutation(async () => {
      const result = await db.refreshAllChallengeSummaries();
      return result;
    }),
});
