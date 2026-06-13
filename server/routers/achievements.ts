/**
 * server/routers/achievements.ts
 * 
 * 達成記念ページ関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const achievementsRouter = router({
  // 達成記念ページを作成
  create: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      title: z.string(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await db.getEventById(input.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Permission denied");
      }
      
      const participations = await db.getParticipationsByEventId(input.challengeId);
      
      const result = await db.createAchievementPage({
        challengeId: input.challengeId,
        achievedAt: new Date(),
        finalValue: challenge.currentValue || 0,
        goalValue: challenge.goalValue || 100,
        totalParticipants: participations.length,
        title: input.title,
        message: input.message,
        isPublic: true,
      });
      return { success: !!result, id: result };
    }),

  // 達成記念ページを取得
  get: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getAchievementPage(input.challengeId);
    }),

  // 達成記念ページを更新
  update: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      title: z.string().optional(),
      message: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await db.getEventById(input.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Permission denied");
      }
      await db.updateAchievementPage(input.challengeId, {
        title: input.title,
        message: input.message,
        isPublic: input.isPublic,
      });
      return { success: true };
    }),

  // 公開中の達成記念ページ一覧
  public: publicProcedure
    .query(async () => {
      return db.getPublicAchievementPages();
    }),
});
