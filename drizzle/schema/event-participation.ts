/**
 * 集まり（events）への参加表明。
 * doin-challenge.com の participations を events 向けに簡略化した Postgres 版。
 */

import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  serial,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";

export const eventParticipations = pgTable(
  "event_participations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("eventId").notNull(),
    userId: integer("userId").notNull(),
    displayName: text("displayName").notNull(),
    username: varchar("username", { length: 255 }),
    profileImage: text("profileImage"),
    message: text("message"),
    prefecture: varchar("prefecture", { length: 32 }),
    companionCount: integer("companionCount").default(0).notNull(),
    /** 開始前リマインド（1日前・1時間前・15分前）を受け取る */
    reminderEnabled: boolean("reminderEnabled").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => [
    index("event_participations_eventId_idx").on(table.eventId),
    index("event_participations_userId_idx").on(table.userId),
    // 同一ユーザーの同一イベント参加表明は1行に統一（upsertParticipationのTOCTOU対策）。
    // 旧 event_participations_event_user_idx（非UNIQUE）を UNIQUE 化。
    uniqueIndex("event_participations_event_user_uidx").on(table.eventId, table.userId),
  ],
);

export type EventParticipation = typeof eventParticipations.$inferSelect;
export type InsertEventParticipation = typeof eventParticipations.$inferInsert;
