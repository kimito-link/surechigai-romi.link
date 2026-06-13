/**
 * server/routers/rankings.ts
 * 
 * ランキング関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const rankingsRouter = router({
  // 貢献度ランキング
  contribution: publicProcedure
    .input(z.object({
      period: z.enum(["weekly", "monthly", "all"]).optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return db.getGlobalContributionRanking(input.period || "all", input.limit || 50);
    }),

  // チャレンジ達成率ランキング
  challengeAchievement: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.getChallengeAchievementRanking(input.limit || 50);
    }),

  // ホストランキング
  hosts: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.getHostRanking(input.limit || 50);
    }),

  // 自分のランキング位置を取得
  myPosition: protectedProcedure
    .input(z.object({ period: z.enum(["weekly", "monthly", "all"]).optional() }))
    .query(async ({ ctx, input }) => {
      return db.getUserRankingPosition(ctx.user.id, input.period || "all");
    }),
});
