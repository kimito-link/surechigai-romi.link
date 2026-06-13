/**
 * server/routers/picked-comments.ts
 * 
 * ピックアップコメント関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const pickedCommentsRouter = router({
  // チャレンジのピックアップコメント一覧
  list: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getPickedCommentsWithParticipation(input.challengeId);
    }),

  // コメントをピックアップ（管理者/ホスト用）
  pick: protectedProcedure
    .input(z.object({
      participationId: z.number(),
      challengeId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await db.getEventById(input.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Permission denied");
      }
      const result = await db.pickComment(input.participationId, input.challengeId, ctx.user.id, input.reason);
      return { success: !!result, id: result };
    }),

  // ピックアップ解除
  unpick: protectedProcedure
    .input(z.object({ participationId: z.number(), challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await db.getEventById(input.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Permission denied");
      }
      await db.unpickComment(input.participationId);
      return { success: true };
    }),

  // 動画使用済みにマーク
  markAsUsed: protectedProcedure
    .input(z.object({ id: z.number(), challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await db.getEventById(input.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Permission denied");
      }
      await db.markCommentAsUsedInVideo(input.id);
      return { success: true };
    }),

  // コメントがピックアップされているかチェック
  isPicked: publicProcedure
    .input(z.object({ participationId: z.number() }))
    .query(async ({ input }) => {
      return db.isCommentPicked(input.participationId);
    }),
});
