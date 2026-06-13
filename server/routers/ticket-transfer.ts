/**
 * server/routers/ticket-transfer.ts
 * 
 * チケット譲渡関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const ticketTransferRouter = router({
  // 譲渡投稿を作成
  create: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      ticketCount: z.number().min(1).max(10).default(1),
      priceType: z.enum(["face_value", "negotiable", "free"]).default("face_value"),
      comment: z.string().max(500).optional(),
      userUsername: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createTicketTransfer({
        challengeId: input.challengeId,
        userId: ctx.user.id,
        userName: ctx.user.name || "匿名",
        userUsername: input.userUsername,
        userImage: null,
        ticketCount: input.ticketCount,
        priceType: input.priceType,
        comment: input.comment,
      });
      
      const waitlistUsers = await db.getWaitlistUsersForNotification(input.challengeId);
      
      return { success: !!result, id: result, notifiedCount: waitlistUsers.length };
    }),

  // チャレンジの譲渡投稿一覧を取得
  listByChallenge: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getTicketTransfersForChallenge(input.challengeId);
    }),

  // 自分の譲渡投稿一覧を取得
  myTransfers: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getTicketTransfersForUser(ctx.user.id);
    }),

  // 譲渡投稿のステータスを更新
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["available", "reserved", "completed", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateTicketTransferStatus(input.id, input.status);
      return { success: true };
    }),

  // 譲渡投稿をキャンセル
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.cancelTicketTransfer(input.id, ctx.user.id);
      return { success: result };
    }),
});
