/**
 * server/routers/dm.ts
 * 
 * ダイレクトメッセージ関連のルーター
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const dmRouter = router({
  // DMを送信
  send: protectedProcedure
    .input(z.object({
      toUserId: z.number(),
      challengeId: z.number(),
      message: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.sendDirectMessage({
        fromUserId: ctx.user.id,
        fromUserName: ctx.user.name || "匿名",
        fromUserImage: null,
        toUserId: input.toUserId,
        challengeId: input.challengeId,
        message: input.message,
      });
      return { success: !!result, id: result };
    }),

  // 会話一覧を取得
  conversations: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      cursor: z.number().optional(), // 最後に取得したmessageId
    }))
    .query(async ({ ctx, input }) => {
      const conversations = await db.getConversationList(
        ctx.user.id,
        input.limit,
        input.cursor
      );
      
      return {
        items: conversations,
        nextCursor: conversations.length === input.limit 
          ? conversations[conversations.length - 1].id 
          : undefined,
      };
    }),

  // 特定の会話を取得
  getConversation: protectedProcedure
    .input(z.object({
      partnerId: z.number(),
      challengeId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getConversation(ctx.user.id, input.partnerId, input.challengeId);
    }),

  // 未読メッセージ数を取得
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getUnreadMessageCount(ctx.user.id);
    }),

  // メッセージを既読にする
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const message = await db.getDirectMessageById(input.id);
      if (!message) throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      if (message.toUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only mark your own messages as read" });
      }
      await db.markMessageAsRead(input.id);
      return { success: true };
    }),

  // 特定の相手からのメッセージを全て既読にする
  markAllAsRead: protectedProcedure
    .input(z.object({ fromUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markAllMessagesAsRead(ctx.user.id, input.fromUserId);
      return { success: true };
    }),
});
