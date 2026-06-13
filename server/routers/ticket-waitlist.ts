/**
 * server/routers/ticket-waitlist.ts
 * 
 * チケット待機リスト関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const ticketWaitlistRouter = router({
  // 待機リストに登録
  add: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      desiredCount: z.number().min(1).max(10).default(1),
      userUsername: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.addToTicketWaitlist({
        challengeId: input.challengeId,
        userId: ctx.user.id,
        userName: ctx.user.name || "匿名",
        userUsername: input.userUsername,
        userImage: null,
        desiredCount: input.desiredCount,
      });
      return { success: !!result, id: result };
    }),

  // 待機リストから削除
  remove: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.removeFromTicketWaitlist(input.challengeId, ctx.user.id);
      return { success: result };
    }),

  // チャレンジの待機リストを取得
  listByChallenge: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getTicketWaitlistForChallenge(input.challengeId);
    }),

  // 自分の待機リストを取得
  myWaitlist: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getTicketWaitlistForUser(ctx.user.id);
    }),

  // 待機リストに登録しているかチェック
  isInWaitlist: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.isUserInWaitlist(input.challengeId, ctx.user.id);
    }),
});
