/**
 * プレミアム（月額サブスクリプション）の権利保持。
 *
 * 設計は docs/monetization-DESIGN.md。要点:
 * - シングルトンの設定行を作らない。ユーザー行の有無だけが真実。
 *   sponsor_config は「行が無いとき enabled:true にフォールバック」するフェイルオープンで、
 *   新規環境ではキルスイッチが効かない事故を抱えている。ここは逆極性にする。
 * - 判定は「行があり、status='active' かつ currentPeriodEnd > now()」。
 *   行が無い・DBに繋がらない・判定に失敗した場合はすべて「無料」に倒す。
 *   誤って全員無料になることはあっても、誤って全員プレミアムになることはない。
 * - locations と同じく userId を持つので、アカウント削除に自然に乗る。
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/** RevenueCat の webhook が送ってくる状態を、こちらの語彙に畳んだもの */
export type PremiumStatus = "active" | "expired" | "revoked";

export const premiumEntitlements = pgTable(
  "premium_entitlements",
  {
    id: serial("id").primaryKey(),
    /** users.id。1ユーザー1行（複数プラットフォームで買っても1行に集約する） */
    userId: integer("userId").notNull(),
    /** active / expired / revoked（返金・不正時）。既定は active */
    status: text("status").default("active").notNull(),
    /** ストアの商品ID */
    productId: varchar("productId", { length: 64 }).notNull(),
    /** ios / android / web */
    platform: text("platform").notNull(),
    /** RevenueCat の app_user_id（"user_" + users.id）。webhook の upsert キー */
    rcAppUserId: varchar("rcAppUserId", { length: 64 }).notNull(),
    /** この時刻まで有効。解約後も期間終了までは使える */
    currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
    /** 次回自動更新するか。解約すると false になるが currentPeriodEnd までは有効 */
    willRenew: boolean("willRenew").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("premium_entitlements_userId_uidx").on(table.userId),
    index("premium_entitlements_rcAppUserId_idx").on(table.rcAppUserId),
    index("premium_entitlements_currentPeriodEnd_idx").on(table.currentPeriodEnd),
  ],
);

export type PremiumEntitlement = typeof premiumEntitlements.$inferSelect;
export type InsertPremiumEntitlement = typeof premiumEntitlements.$inferInsert;
