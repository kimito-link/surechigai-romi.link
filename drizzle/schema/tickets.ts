/**
 * Ticket-related Schema Tables
 *
 * チケット譲渡・待機リスト関連のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

export const ticketTransfers = mysqlTable("ticket_transfers", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userUsername: varchar("userUsername", { length: 255 }),
  userImage: text("userImage"),
  ticketCount: int("ticketCount").default(1).notNull(),
  priceType: mysqlEnum("priceType", ["face_value", "negotiable", "free"]).default("face_value").notNull(),
  comment: text("comment"),
  status: mysqlEnum("status", ["available", "reserved", "completed", "cancelled"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketTransfer = typeof ticketTransfers.$inferSelect;
export type InsertTicketTransfer = typeof ticketTransfers.$inferInsert;

export const ticketWaitlist = mysqlTable("ticket_waitlist", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userUsername: varchar("userUsername", { length: 255 }),
  userImage: text("userImage"),
  desiredCount: int("desiredCount").default(1).notNull(),
  notifyOnNew: boolean("notifyOnNew").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketWaitlist = typeof ticketWaitlist.$inferSelect;
export type InsertTicketWaitlist = typeof ticketWaitlist.$inferInsert;
