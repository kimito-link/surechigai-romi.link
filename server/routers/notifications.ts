/**
 * server/routers/notifications.ts
 * 
 * 通知関連のルーター
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  // 通知設定取得
  getSettings: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const settings = await db.getNotificationSettings(ctx.user.id);
      return settings;
    }),

  // 通知設定更新
  updateSettings: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      onGoalReached: z.boolean().optional(),
      onMilestone25: z.boolean().optional(),
      onMilestone50: z.boolean().optional(),
      onMilestone75: z.boolean().optional(),
      onNewParticipant: z.boolean().optional(),
      expoPushToken: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { challengeId, ...settings } = input;
      await db.upsertNotificationSettings(ctx.user.id, challengeId, settings);
      return { success: true };
    }),

  // 通知履歴取得
  list: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      cursor: z.number().optional(), // 最後に取得したnotificationId
    }))
    .query(async ({ ctx, input }) => {
      const notifications = await db.getNotificationsByUserId(
        ctx.user.id,
        input.limit,
        input.cursor
      );
      
      return {
        items: notifications,
        nextCursor: notifications.length === input.limit 
          ? notifications[notifications.length - 1].id 
          : undefined,
      };
    }),

  // 通知を既読にする
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.id);
      return { success: true };
    }),

  // 全ての通知を既読にする
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),
});
