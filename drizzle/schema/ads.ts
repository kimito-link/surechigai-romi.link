/**
 * Self-hosted sponsor card delivery.
 *
 * No external ad SDKs or per-impression event logs. Delivery is controlled by
 * sponsor_config and daily aggregate counters.
 */

import {
  boolean,
  date,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export type SponsorSlot = "checkin_complete" | "zukan_feed" | "mypage_stats";

export type SponsorSlotFlags = Partial<Record<SponsorSlot, boolean>>;

export const sponsorCards = pgTable(
  "sponsor_cards",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 120 }).notNull(),
    body: text("body").notNull(),
    imageUrl: text("imageUrl").notNull(),
    linkUrl: text("linkUrl").notNull(),
    prefecture: varchar("prefecture", { length: 32 }),
    municipality: text("municipality"),
    weight: integer("weight").default(1).notNull(),
    startsAt: timestamp("startsAt").defaultNow().notNull(),
    endsAt: timestamp("endsAt"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("sponsor_cards_active_idx").on(table.active),
    index("sponsor_cards_prefecture_idx").on(table.prefecture),
    index("sponsor_cards_schedule_idx").on(table.startsAt, table.endsAt),
  ],
);

export const sponsorConfig = pgTable("sponsor_config", {
  id: integer("id").primaryKey().default(1).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  slotFlags: json("slotFlags")
    .$type<SponsorSlotFlags>()
    .default({ checkin_complete: true, zukan_feed: false, mypage_stats: false })
    .notNull(),
  dailyCap: integer("dailyCap").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const adStatsDaily = pgTable(
  "ad_stats_daily",
  {
    id: serial("id").primaryKey(),
    cardId: integer("cardId").notNull(),
    statDate: date("date", { mode: "string" }).notNull(),
    impressions: integer("impressions").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ad_stats_daily_card_date_uidx").on(table.cardId, table.statDate),
    index("ad_stats_daily_date_idx").on(table.statDate),
  ],
);

export const adUserDailyCaps = pgTable(
  "ad_user_daily_caps",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    statDate: date("date", { mode: "string" }).notNull(),
    impressions: integer("impressions").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ad_user_daily_caps_user_date_uidx").on(table.userId, table.statDate),
    index("ad_user_daily_caps_date_idx").on(table.statDate),
  ],
);

export type SponsorCard = typeof sponsorCards.$inferSelect;
export type InsertSponsorCard = typeof sponsorCards.$inferInsert;
export type SponsorConfig = typeof sponsorConfig.$inferSelect;
export type InsertSponsorConfig = typeof sponsorConfig.$inferInsert;
export type AdStatsDaily = typeof adStatsDaily.$inferSelect;
export type InsertAdStatsDaily = typeof adStatsDaily.$inferInsert;
export type AdUserDailyCap = typeof adUserDailyCaps.$inferSelect;
export type InsertAdUserDailyCap = typeof adUserDailyCaps.$inferInsert;
