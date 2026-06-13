/**
 * server/routers/events.ts
 * 
 * イベント関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { generateRequestId } from "../_core/request-id";

export const eventsRouter = router({
  // 公開イベント一覧取得
  list: publicProcedure.query(async () => {
    return db.getAllEvents();
  }),

  // ページネーション対応のイベント一覧取得（DB側でフィルタ・ページネーション）
  listPaginated: publicProcedure
    .input(z.object({
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
      filter: z.enum(["all", "solo", "group"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { cursor = 0, limit, filter, search } = input;
      const result = await db.getEventsPaginated({ cursor, limit, filter, search });
      return result;
    }),

  // イベント詳細取得
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const requestId = generateRequestId();
      const startTime = Date.now();
      
      console.log(`[events.getById] requestId=${requestId} input.id=${input.id} START`);
      
      try {
        const event = await db.getEventById(input.id);
        
        if (!event) {
          console.log(`[events.getById] requestId=${requestId} id=${input.id} NOT_FOUND elapsed=${Date.now() - startTime}ms`);
          return null;
        }
        
        const participantCount = await db.getTotalCompanionCountByEventId(input.id);
        
        console.log(`[events.getById] requestId=${requestId} id=${input.id} FOUND title="${event.title}" participantCount=${participantCount} elapsed=${Date.now() - startTime}ms`);
        
        return { ...event, participantCount };
      } catch (error) {
        console.error(`[events.getById] requestId=${requestId} id=${input.id} ERROR:`, error);
        throw error;
      }
    }),

  // 自分が作成したイベント一覧
  myEvents: protectedProcedure.query(async ({ ctx }) => {
    return db.getEventsByHostTwitterId(ctx.user.openId);
  }),

  // イベント作成（認証必須 - BUG-001修正）
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      eventDate: z.string(),
      venue: z.string().optional(),
      hostName: z.string(),
      hostUsername: z.string().optional(),
      hostProfileImage: z.string().optional(),
      hostFollowersCount: z.number().optional(),
      hostDescription: z.string().optional(),
      goalType: z.enum(["attendance", "followers", "viewers", "points", "custom"]).optional(),
      goalValue: z.number().optional(),
      goalUnit: z.string().optional(),
      eventType: z.enum(["solo", "group"]).optional(),
      categoryId: z.number().optional(),
      externalUrl: z.string().url().optional().or(z.literal("")),
      ticketPresale: z.number().optional(),
      ticketDoor: z.number().optional(),
      ticketUrl: z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const eventId = await db.createEvent({
          hostUserId: ctx.user.id,
          hostTwitterId: ctx.user.openId,
          hostName: input.hostName,
          hostUsername: input.hostUsername,
          hostProfileImage: input.hostProfileImage,
          hostFollowersCount: input.hostFollowersCount,
          hostDescription: input.hostDescription,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          venue: input.venue,
          isPublic: true,
          goalType: input.goalType || "attendance",
          goalValue: input.goalValue || 100,
          goalUnit: input.goalUnit || "人",
          eventType: input.eventType || "solo",
          categoryId: input.categoryId,
          externalUrl: input.externalUrl,
          ticketPresale: input.ticketPresale,
          ticketDoor: input.ticketDoor,
          ticketUrl: input.ticketUrl,
        });
        return { id: eventId };
      } catch (error) {
        console.error("[Challenge Create] Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("Database not available") || errorMessage.includes("ECONNREFUSED")) {
          throw new Error("サーバーに接続できません。しばらく待ってから再度お試しください。");
        }
        
        if (errorMessage.includes("SQL") || errorMessage.includes("Failed query") || errorMessage.includes("ER_")) {
          throw new Error("チャレンジの作成に失敗しました。入力内容を確認して再度お試しください。");
        }
        
        if (errorMessage.includes("Duplicate entry") || errorMessage.includes("unique constraint")) {
          throw new Error("同じタイトルのチャレンジがすでに存在します。別のタイトルをお試しください。");
        }
        
        throw new Error("チャレンジの作成中にエラーが発生しました。しばらく待ってから再度お試しください。");
      }
    }),

  // イベント更新
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      eventDate: z.string().optional(),
      venue: z.string().optional(),
      isPublic: z.boolean().optional(),
      goalValue: z.number().optional(),
      goalUnit: z.string().optional(),
      goalType: z.enum(["attendance", "followers", "viewers", "points", "custom"]).optional(),
      eventType: z.enum(["solo", "group"]).optional(),
      categoryId: z.number().optional(),
      externalUrl: z.string().optional(),
      ticketPresale: z.number().optional(),
      ticketDoor: z.number().optional(),
      ticketUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.getEventById(input.id);
      if (!event || event.hostTwitterId !== ctx.user.openId) {
        throw new Error("Unauthorized");
      }
      const { id, eventDate, ...rest } = input;
      await db.updateEvent(id, {
        ...rest,
        ...(eventDate ? { eventDate: new Date(eventDate) } : {}),
      });
      return { success: true };
    }),

  // イベント削除
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.getEventById(input.id);
      if (!event || event.hostTwitterId !== ctx.user.openId) {
        throw new Error("Unauthorized");
      }
      await db.deleteEvent(input.id);
      return { success: true };
    }),
});
