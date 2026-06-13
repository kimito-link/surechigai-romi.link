/**
 * Audit Log Schema
 *
 * 監査ログテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, json } from "drizzle-orm/mysql-core";

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 36 }).notNull(),
  action: mysqlEnum("action", [
    "CREATE", "EDIT", "DELETE", "RESTORE", "BULK_DELETE", "BULK_RESTORE", "LOGIN", "LOGOUT", "ADMIN_ACTION",
  ]).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  targetId: int("targetId"),
  actorId: int("actorId"),
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
