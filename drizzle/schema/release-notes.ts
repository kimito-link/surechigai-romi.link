/**
 * Release Notes Schema
 *
 * リリースノート（アップデート履歴）のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, json } from "drizzle-orm/mysql-core";

export const releaseNotes = mysqlTable("release_notes", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 32 }).notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  title: text("title").notNull(),
  changes: json("changes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReleaseNote = typeof releaseNotes.$inferSelect;
export type InsertReleaseNote = typeof releaseNotes.$inferInsert;
