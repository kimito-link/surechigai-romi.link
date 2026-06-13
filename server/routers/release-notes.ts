/**
 * Release Notes Router
 * 
 * リリースノート（アップデート履歴）のtRPCエンドポイント
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb, desc } from "../db/connection";
import { releaseNotes } from "../../drizzle/schema";

export const releaseNotesRouter = router({
  // すべてのリリースノートを取得
  getAll: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(releaseNotes).orderBy(desc(releaseNotes.date));
    }),
  
  // 最新のリリースノートを取得
  getLatest: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(releaseNotes).orderBy(desc(releaseNotes.date)).limit(input.limit);
    }),

  // リリースノートを追加（管理者のみ）
  add: protectedProcedure
    .input(z.object({
      version: z.string(),
      date: z.string(),
      title: z.string(),
      changes: z.array(z.object({
        type: z.enum(["new", "improve", "fix", "change"]),
        text: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("管理者権限が必要です");
      }
      const db = await getDb();
      if (!db) {
        throw new Error("データベース接続に失敗しました");
      }
      
      await db.insert(releaseNotes).values(input);
      return { success: true };
    }),
});
