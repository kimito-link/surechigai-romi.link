/**
 * DB growth monitoring snapshots.
 *
 * Daily sweep records approximate table/database sizes without running COUNT(*).
 */

import {
  bigint,
  index,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const dbStatsSnapshots = pgTable(
  "db_stats_snapshots",
  {
    id: serial("id").primaryKey(),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
    locationsBytes: bigint("locationsBytes", { mode: "number" }).notNull(),
    locationsRows: bigint("locationsRows", { mode: "number" }).notNull(),
    totalDbBytes: bigint("totalDbBytes", { mode: "number" }).notNull(),
  },
  (table) => [
    index("db_stats_snapshots_capturedAt_idx").on(table.capturedAt),
  ],
);

export type DbStatsSnapshot = typeof dbStatsSnapshots.$inferSelect;
export type InsertDbStatsSnapshot = typeof dbStatsSnapshots.$inferInsert;

/**
 * 利用状況の日次スナップショット（2026-09-08 追加）。
 *
 * ★なぜ必要か
 *   2026-09-07 に本番DBを手で集計して初めて「実ユーザーが0人」「7人全員が
 *   登録日と最終ログイン日が同じ」と分かった。それまで**誰も気づいていなかった**。
 *   数字を見る手段が無いまま機能を足すのは、目を閉じて運転するのと同じ。
 *
 * ★この方式の限界（必ず読むこと）
 *   ここで測れるのは**登録済みユーザーの行動だけ**。
 *   「何人が訪問して、何人が登録しなかったか」は測れない。
 *   訪問者数を測るには Vercel Web Analytics の有効化（ダッシュボード操作）が要る。
 *   実測: /_vercel/insights/script.js は 200 で text/html を返す＝未有効化。
 *
 * ★指標を増やしすぎないこと。判断に使うものだけ置く。
 *   見ない数字を増やすと、本当に見るべき数字が埋もれる。
 */
export const usageSnapshots = pgTable(
  "usage_snapshots",
  {
    id: serial("id").primaryKey(),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
    /** 総ユーザー数 */
    totalUsers: bigint("totalUsers", { mode: "number" }).notNull(),
    /** 直近7日にログインした人数。★「戻ってきているか」の中心指標 */
    activeUsers7d: bigint("activeUsers7d", { mode: "number" }).notNull(),
    /** 直近30日にログインした人数 */
    activeUsers30d: bigint("activeUsers30d", { mode: "number" }).notNull(),
    /** 足あとを1件でも持つ人数（＝実際に使い始めた人） */
    usersWithLocations: bigint("usersWithLocations", { mode: "number" }).notNull(),
    /** 直近7日に足あとを残した人数 */
    activeLoggers7d: bigint("activeLoggers7d", { mode: "number" }).notNull(),
    /** 場所メモの総数。★実装済みだが2026-09-07時点で0件 */
    placeNotes: bigint("placeNotes", { mode: "number" }).notNull(),
    /** すれ違い（マッチング成立）の総数 */
    encounters: bigint("encounters", { mode: "number" }).notNull(),
    /** 集まりの総数 */
    events: bigint("events", { mode: "number" }).notNull(),
    /** 参加表明の総数 */
    participations: bigint("participations", { mode: "number" }).notNull(),
  },
  (table) => [
    index("usage_snapshots_capturedAt_idx").on(table.capturedAt),
  ],
);

export type UsageSnapshot = typeof usageSnapshots.$inferSelect;
export type InsertUsageSnapshot = typeof usageSnapshots.$inferInsert;
