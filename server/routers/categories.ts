/**
 * server/routers/categories.ts
 * 
 * カテゴリ関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const categoriesRouter = router({
  // カテゴリ一覧を取得
  list: publicProcedure
    .query(async () => {
      return db.getAllCategories();
    }),

  // カテゴリ詳細を取得
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getCategoryById(input.id);
    }),

  // カテゴリ別チャレンジ一覧
  challenges: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      return db.getChallengesByCategory(input.categoryId);
    }),

  // カテゴリ作成（管理者のみ）
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(100),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("管理者権限が必要です");
      }
      return db.createCategory(input);
    }),

  // カテゴリ更新（管理者のみ）
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("管理者権限が必要です");
      }
      const { id, ...data } = input;
      return db.updateCategory(id, data);
    }),

  // カテゴリ削除（管理者のみ）
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("管理者権限が必要です");
      }
      return db.deleteCategory(input.id);
    }),
});
