/**
 * server/routers/profiles.ts
 * 
 * 公開プロフィール関連のルーター
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

const genderSchema = z.enum(["male", "female", "unspecified"]);

export const profilesRouter = router({
  // 認証中ユーザーの自分用プロフィール取得（auth.me と同様だが profiles 名前空間）
  me: publicProcedure.query((opts) => opts.ctx.user),

  // 自分のプロフィール（都道府県・性別）を更新
  updateMyProfile: protectedProcedure
    .input(
      z.object({
        prefecture: z.string().max(32).nullable().optional(),
        gender: genderSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertUser({
        openId: ctx.user.openId,
        ...(input.prefecture !== undefined && { prefecture: input.prefecture }),
        ...(input.gender !== undefined && { gender: input.gender }),
      });
      const updated = await db.getUserByOpenId(ctx.user.openId);
      return { user: updated ?? null };
    }),

  // ユーザーの公開プロフィールを取得
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getUserPublicProfile(input.userId);
    }),
  
  // twitterIdでユーザーを取得（外部共有URL用）
  getByTwitterId: publicProcedure
    .input(z.object({ twitterId: z.string() }))
    .query(async ({ input }) => {
      return db.getUserByTwitterId(input.twitterId);
    }),
  
  // 推し活状況を取得
  getOshikatsuStats: publicProcedure
    .input(z.object({
      userId: z.number().optional(),
      twitterId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return db.getOshikatsuStats(input.userId, input.twitterId);
    }),
  
  // おすすめホスト（同じカテゴリのチャレンジを開催しているホスト）
  recommendedHosts: publicProcedure
    .input(z.object({ 
      categoryId: z.number().optional(),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      return db.getRecommendedHosts(userId, input.categoryId, input.limit);
    }),
});
