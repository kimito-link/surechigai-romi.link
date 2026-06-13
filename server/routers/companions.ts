/**
 * server/routers/companions.ts
 * 
 * 友人（コンパニオン）関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const companionsRouter = router({
  // 参加者の友人一覧を取得
  forParticipation: publicProcedure
    .input(z.object({ participationId: z.number() }))
    .query(async ({ input }) => {
      return db.getCompanionsForParticipation(input.participationId);
    }),

  // チャレンジの友人一覧を取得
  forChallenge: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getCompanionsForChallenge(input.challengeId);
    }),

  // 自分が招待した友人の統計
  myInviteStats: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getCompanionInviteStats(ctx.user.id);
    }),

  // 友人を削除
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const stats = await db.getCompanionInviteStats(ctx.user.id);
      const companion = stats.companions.find(c => c.id === input.id);
      if (!companion) {
        throw new Error("Unauthorized");
      }
      await db.deleteCompanion(input.id);
      return { success: true };
    }),
});
