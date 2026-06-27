/**
 * Audit Log Schema
 *
 * 監査ログテーブル定義
 * 君斗りんくのすれ違ひ通信: pg-core (Supabase Postgres) 版
 */

import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  json,
  serial,
} from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  requestId: varchar("requestId", { length: 36 }).notNull(),
  // ENUM → text（CHECK制約はDB側で持つ場合はdrizzle-kitが生成するが、型安全性はアプリ側で保証）
  action: text("action").notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  targetId: integer("targetId"),
  actorId: integer("actorId"),
  actorName: varchar("actorName", { length: 255 }),
  actorRole: varchar("actorRole", { length: 32 }),
  beforeData: json("beforeData").$type<Record<string, unknown> | null>(),
  afterData: json("afterData").$type<Record<string, unknown> | null>(),
  reason: text("reason"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  DELETE: "DELETE",
  RESTORE: "RESTORE",
  BULK_DELETE: "BULK_DELETE",
  BULK_RESTORE: "BULK_RESTORE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  ADMIN_ACTION: "ADMIN_ACTION",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const ENTITY_TYPES = {
  PARTICIPATION: "participation",
  CHALLENGE: "challenge",
  USER: "user",
  CHEER: "cheer",
  COMMENT: "comment",
  INVITATION: "invitation",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];
