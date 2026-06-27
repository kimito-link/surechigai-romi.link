/**
 * 君斗りんくのすれ違ひ通信: Encounter-related Schema Tables
 *
 * 設計書 V2-SURECHIGAI-DESIGN.md のデータ設計骨子に準拠。
 * 生緯度経度は保存しない（H3 res8 + 500mグリッドに丸めて永続化）。
 * DB: Supabase Free (Postgres) / pg-core
 */

import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  real,
  serial,
  uniqueIndex,
  index,
  boolean,
} from "drizzle-orm/pg-core";

// =============================================================================
// locations — 48h TTL物理削除。生の緯度経度は保存しない。
// =============================================================================

export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    /** H3 resolution 8 セル (約460m)。すれ違いマッチングに使う粗い粒度。 */
    h3R8: text("h3R8").notNull(),
    /** 500mグリッド丸め済み緯度（マッチング・互換用） */
    latGrid: real("latGrid").notNull(),
    /** 500mグリッド丸め済み経度（マッチング・互換用） */
    lngGrid: real("lngGrid").notNull(),
    /**
     * 正確な緯度（思い出の軌跡用）。後でその場所に行ける精度で残す。
     * 方針転換: 思い出をたどる/聖地巡礼のため、生座標を保存し48hでも消さない。
     * 自衛は移動専用アカウント運用に委ねる。NULL可（旧データ互換）。
     */
    lat: real("lat"),
    /** 正確な経度（思い出の軌跡用） */
    lng: real("lng"),
    /** 位置精度（メートル）。記録時の accuracy を残す。 */
    accuracyM: real("accuracyM"),
    municipality: text("municipality"),
    prefecture: varchar("prefecture", { length: 32 }),
    address: text("address"),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  },
  (table) => [
    index("locations_h3R8_idx").on(table.h3R8),
    index("locations_userId_idx").on(table.userId),
    index("locations_recordedAt_idx").on(table.recordedAt),
  ]
);

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

// =============================================================================
// encounters — UNIQUE(userAId, userBId, dayKey)
// userAId < userBId に正規化（アプリ側で保証）
// dayKey = occurredAt の日付文字列 "YYYY-MM-DD"（生成列の代わりに text カラムで実現）
// =============================================================================

export const encounters = pgTable(
  "encounters",
  {
    id: serial("id").primaryKey(),
    /** 常に userAId < userBId となるよう正規化 */
    userAId: integer("userAId").notNull(),
    userBId: integer("userBId").notNull(),
    /**
     * すれ違いティア:
     * 1=500m すれ違い, 2=3km ご近所,
     * 3=10km 同じ街, 4=50km 同じ地域, 5=タイムシフト
     */
    tier: integer("tier").notNull(),
    /** H3 resolution 7 セル（表示粒度） */
    h3R7: text("h3R7"),
    areaName: text("areaName"),
    prefecture: varchar("prefecture", { length: 32 }),
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
    /** 日付文字列 "YYYY-MM-DD"。UNIQUE 制約のキーに使用 */
    dayKey: varchar("dayKey", { length: 10 }).notNull(),
    /** NULL = 未開封（封筒UI） */
    openedByA: timestamp("openedByA"),
    /** NULL = 未開封（封筒UI） */
    openedByB: timestamp("openedByB"),
  },
  (table) => [
    uniqueIndex("encounters_pair_day_uidx").on(table.userAId, table.userBId, table.dayKey),
    index("encounters_userA_idx").on(table.userAId),
    index("encounters_userB_idx").on(table.userBId),
    index("encounters_occurredAt_idx").on(table.occurredAt),
  ]
);

export type Encounter = typeof encounters.$inferSelect;
export type InsertEncounter = typeof encounters.$inferInsert;

// =============================================================================
// reactions — 一方向リアクション。UNIQUE(encounterId, senderId)
// =============================================================================

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    encounterId: integer("encounterId").notNull(),
    senderId: integer("senderId").notNull(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reactions_encounter_sender_uidx").on(table.encounterId, table.senderId),
    index("reactions_encounterId_idx").on(table.encounterId),
  ]
);

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = typeof reactions.$inferInsert;

// =============================================================================
// visitedAreas — 図鑑・軌跡用の粗い長期データ。UNIQUE(userId, h3R7)
// =============================================================================

export const visitedAreas = pgTable(
  "visited_areas",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    /** H3 resolution 7 セル（市区町村粒度の粗さ） */
    h3R7: text("h3R7").notNull(),
    municipality: text("municipality"),
    prefecture: varchar("prefecture", { length: 32 }),
    firstVisitedAt: timestamp("firstVisitedAt").defaultNow().notNull(),
    lastVisitedAt: timestamp("lastVisitedAt").defaultNow().notNull(),
    visitCount: integer("visitCount").default(1).notNull(),
  },
  (table) => [
    uniqueIndex("visited_areas_user_h3_uidx").on(table.userId, table.h3R7),
    index("visited_areas_userId_idx").on(table.userId),
    index("visited_areas_h3R7_idx").on(table.h3R7),
  ]
);

export type VisitedArea = typeof visitedAreas.$inferSelect;
export type InsertVisitedArea = typeof visitedAreas.$inferInsert;

// =============================================================================
// blocks — UNIQUE(blockerId, blockedId)
// =============================================================================

export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    blockerId: integer("blockerId").notNull(),
    blockedId: integer("blockedId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("blocks_pair_uidx").on(table.blockerId, table.blockedId),
    index("blocks_blockerId_idx").on(table.blockerId),
    index("blocks_blockedId_idx").on(table.blockedId),
  ]
);

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = typeof blocks.$inferInsert;

// =============================================================================
// reports — 異なる reporter から3件で対象ユーザーを自動停止 (users.isSuspended)
// reason: inappropriate_hitokoto / spam / harassment / other
// =============================================================================

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: integer("reporterId").notNull(),
    targetUserId: integer("targetUserId").notNull(),
    /** NULL可（特定のすれ違いへの通報でない場合） */
    encounterId: integer("encounterId"),
    /**
     * reason: inappropriate_hitokoto | spam | harassment | other
     * CHECK制約はdrizzle-kitのcheck()で定義
     */
    reason: text("reason").notNull(),
    detail: text("detail"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("reports_targetUserId_idx").on(table.targetUserId),
    index("reports_reporterId_idx").on(table.reporterId),
  ]
);

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// =============================================================================
// userSettings — 位置一時停止・自宅セル自動マスク
// =============================================================================

export const userSettings = pgTable("user_settings", {
  /** users.id をPKとして1:1 */
  userId: integer("userId").primaryKey(),
  /** NULL = 停止していない。タイムスタンプ未来 = その時刻まで位置停止 */
  locationPausedUntil: timestamp("locationPausedUntil"),
  /**
   * 最頻セル（自宅推定）の H3 res8 セル ID。
   * NULL = マスクなし。このセルを含む locations は照合対象から除外。
   */
  homeMaskCell: text("homeMaskCell"),
  /**
   * 公開共有サムネ(/u/<slug> の OGP)で正確な現在地を出すか。
   * false（既定）= 市区町村粒度（500m丸め座標・町ズーム）で安全側。
   * true = 正確な座標（高ズーム）で「後でその場所に行ける」精度。
   */
  shareLocationPrecise: boolean("shareLocationPrecise").default(false).notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
