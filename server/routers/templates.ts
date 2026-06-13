/**
 * server/routers/templates.ts
 * 
 * チャレンジテンプレート関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const templatesRouter = router({
  // テンプレートを作成
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      goalType: z.enum(["attendance", "followers", "viewers", "points", "custom"]),
      goalValue: z.number().min(1),
      goalUnit: z.string().default("人"),
      eventType: z.enum(["solo", "group"]),
      ticketPresale: z.number().optional(),
      ticketDoor: z.number().optional(),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createChallengeTemplate({
        userId: ctx.user.id,
        ...input,
      });
      return { success: !!result, id: result };
    }),

  // ユーザーのテンプレート一覧
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getChallengeTemplatesForUser(ctx.user.id);
    }),

  // 公開テンプレート一覧
  public: publicProcedure
    .query(async () => {
      return db.getPublicChallengeTemplates();
    }),

  // テンプレート詳細を取得
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getChallengeTemplateById(input.id);
    }),

  // テンプレートを更新
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      goalType: z.enum(["attendance", "followers", "viewers", "points", "custom"]).optional(),
      goalValue: z.number().min(1).optional(),
      goalUnit: z.string().optional(),
      eventType: z.enum(["solo", "group"]).optional(),
      ticketPresale: z.number().optional(),
      ticketDoor: z.number().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const template = await db.getChallengeTemplateById(input.id);
      if (!template) throw new Error("Template not found");
      if (template.userId !== ctx.user.id) throw new Error("Permission denied");
      await db.updateChallengeTemplate(input.id, input);
      return { success: true };
    }),

  // テンプレートを削除
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const template = await db.getChallengeTemplateById(input.id);
      if (!template) throw new Error("Template not found");
      if (template.userId !== ctx.user.id) throw new Error("Permission denied");
      await db.deleteChallengeTemplate(input.id);
      return { success: true };
    }),

  // テンプレートの使用回数をインクリメント
  incrementUseCount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.incrementTemplateUseCount(input.id);
      return { success: true };
    }),
});
