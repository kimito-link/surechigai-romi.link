/**
 * server/routers/badges.ts
 * 
 * バッジ関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const badgesRouter = router({
  // 全バッジ一覧
  list: publicProcedure.query(async () => {
    return db.getAllBadges();
  }),

  // ユーザーのバッジ一覧
  myBadges: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserBadgesWithDetails(ctx.user.id);
  }),

  // バッジ付与（管理者用）
  award: protectedProcedure
    .input(z.object({
      userId: z.number(),
      badgeId: z.number(),
      challengeId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }
      const result = await db.awardBadge(input.userId, input.badgeId, input.challengeId);
      return { success: !!result, id: result };
    }),
});
