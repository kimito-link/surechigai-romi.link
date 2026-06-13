/**
 * server/routers/search.ts
 * 
 * 検索関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const searchRouter = router({
  // チャレンジを検索
  challenges: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return db.searchChallenges(input.query);
    }),

  // ページネーション対応の検索
  challengesPaginated: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const { query, cursor = 0, limit } = input;
      const allResults = await db.searchChallenges(query);
      
      const items = allResults.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < allResults.length ? cursor + limit : undefined;
      
      return {
        items,
        nextCursor,
        totalCount: allResults.length,
      };
    }),

  // 検索履歴を保存
  saveHistory: protectedProcedure
    .input(z.object({ query: z.string(), resultCount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.saveSearchHistory({
        userId: ctx.user.id,
        query: input.query,
        resultCount: input.resultCount,
      });
      return { success: !!result, id: result };
    }),

  // 検索履歴を取得
  history: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return db.getSearchHistoryForUser(ctx.user.id, input.limit || 10);
    }),

  // 検索履歴をクリア
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.clearSearchHistoryForUser(ctx.user.id);
      return { success: true };
    }),

  // ユーザーを検索
  users: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const allUsers = await db.getAllUsers();
      const queryLower = input.query.toLowerCase();
      
      // 全文検索（名前、ユーザー名、説明）
      const results = allUsers.filter((user: any) => {
        const name = (user.name || "").toLowerCase();
        const username = (user.username || "").toLowerCase();
        const description = (user.description || "").toLowerCase();
        
        return name.includes(queryLower) ||
               username.includes(queryLower) ||
               description.includes(queryLower);
      });
      
      return results;
    }),

  // ページネーション対応のユーザー検索
  usersPaginated: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const { query, cursor = 0, limit } = input;
      const allUsers = await db.getAllUsers();
      const queryLower = query.toLowerCase();
      
      // 全文検索（名前、ユーザー名、説明）
      const allResults = allUsers.filter((user: any) => {
        const name = (user.name || "").toLowerCase();
        const username = (user.username || "").toLowerCase();
        const description = (user.description || "").toLowerCase();
        
        return name.includes(queryLower) ||
               username.includes(queryLower) ||
               description.includes(queryLower);
      });
      
      const items = allResults.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < allResults.length ? cursor + limit : undefined;
      
      return {
        items,
        nextCursor,
        totalCount: allResults.length,
      };
    }),

  // メッセージを検索
  messages: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const allMessages = await db.getDirectMessagesForUser(ctx.user.id);
      const queryLower = input.query.toLowerCase();
      
      // 全文検索（メッセージ内容、送信者名）
      const results = allMessages.filter((msg: any) => {
        const message = (msg.message || "").toLowerCase();
        const fromUserName = (msg.fromUserName || "").toLowerCase();
        
        return message.includes(queryLower) ||
               fromUserName.includes(queryLower);
      });
      
      return results;
    }),

  // ページネーション対応のメッセージ検索
  messagesPaginated: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { query, cursor = 0, limit } = input;
      const allMessages = await db.getDirectMessagesForUser(ctx.user.id);
      const queryLower = query.toLowerCase();
      
      // 全文検索（メッセージ内容、送信者名）
      const allResults = allMessages.filter((msg: any) => {
        const message = (msg.message || "").toLowerCase();
        const fromUserName = (msg.fromUserName || "").toLowerCase();
        
        return message.includes(queryLower) ||
               fromUserName.includes(queryLower);
      });
      
      const items = allResults.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < allResults.length ? cursor + limit : undefined;
      
      return {
        items,
        nextCursor,
        totalCount: allResults.length,
      };
    }),
});
