/**
 * server/routers/admin.ts
 * 
 * 管理者用ユーザー管理API
 */
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { adminParticipationsRouter } from "./admin-participations";

export const adminRouter = router({
  // ユーザー一覧取得
  users: adminProcedure
    .query(async () => {
      return db.getAllUsers();
    }),

  // ユーザー権限変更
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  // ユーザー詳細取得
  getUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getUserById(input.userId);
    }),

  // データ整合性レポート取得
  getDataIntegrityReport: adminProcedure
    .query(async () => {
      return db.getDataIntegrityReport();
    }),

  // チャレンジのcurrentValueを再計算して修正
  recalculateCurrentValues: adminProcedure
    .mutation(async () => {
      const results = await db.recalculateChallengeCurrentValues();
      return { success: true, fixedCount: results.length, details: results };
    }),

  // DB構造確認API
  getDbSchema: adminProcedure
    .query(async () => {
      return db.getDbSchema();
    }),

  // テーブル構造とコードの比較
  compareSchemas: adminProcedure
    .query(async () => {
      return db.compareSchemas();
    }),

  // 参加管理（削除済み投稿の管理）
  participations: adminParticipationsRouter,

  // APIコスト設定取得
  getApiCostSettings: adminProcedure
    .query(async () => {
      const { getCostSettings } = await import("../db/api-usage-db");
      return getCostSettings();
    }),

  // APIコスト設定更新
  updateApiCostSettings: adminProcedure
    .input(z.object({
      monthlyLimit: z.number().optional(),
      alertThreshold: z.number().optional(),
      alertEmail: z.string().email().nullable().optional(),
      autoStop: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { upsertCostSettings } = await import("../db/api-usage-db");
      await upsertCostSettings({
        monthlyLimit: input.monthlyLimit?.toFixed(2),
        alertThreshold: input.alertThreshold?.toFixed(2),
        alertEmail: input.alertEmail ?? undefined,
        autoStop: input.autoStop ? 1 : 0,
      });
      return { success: true };
    }),
});
