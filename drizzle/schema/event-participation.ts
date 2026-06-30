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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => [
    index("event_participations_eventId_idx").on(table.eventId),
    index("event_participations_userId_idx").on(table.userId),
    index("event_participations_event_user_idx").on(table.eventId, table.userId),
  ],
);

export type EventParticipation = typeof eventParticipations.$inferSelect;
export type InsertEventParticipation = typeof eventParticipations.$inferInsert;
