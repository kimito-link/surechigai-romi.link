/**
 * server/routers/cheers.ts
 * 
 * エール（参加者同士の応援）関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const cheersRouter = router({
  // エールを送る
  send: protectedProcedure
    .input(z.object({
      toParticipationId: z.number(),
      toUserId: z.number().optional(),
      challengeId: z.number(),
      message: z.string().optional(),
      emoji: z.string().default("👏"),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.sendCheer({
        fromUserId: ctx.user.id,
        fromUserName: ctx.user.name || "匿名",
        fromUserImage: null,
        toParticipationId: input.toParticipationId,
        toUserId: input.toUserId,
        challengeId: input.challengeId,
        message: input.message,
        emoji: input.emoji,
      });
      return { success: !!result, id: result };
    }),

  // 参加者へのエール一覧
  forParticipation: publicProcedure
    .input(z.object({ participationId: z.number() }))
    .query(async ({ input }) => {
      return db.getCheersForParticipation(input.participationId);
    }),

  // チャレンジのエール一覧
  forChallenge: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getCheersForChallenge(input.challengeId);
    }),

  // エール数を取得
  count: publicProcedure
    .input(z.object({ participationId: z.number() }))
    .query(async ({ input }) => {
      return db.getCheerCountForParticipation(input.participationId);
    }),

  // 自分が受けたエール
  received: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getCheersReceivedByUser(ctx.user.id);
    }),

  // 自分が送ったエール
  sent: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getCheersSentByUser(ctx.user.id);
    }),
});
