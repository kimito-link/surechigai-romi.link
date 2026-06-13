/**
 * Challenge-related Schema Tables
 *
 * チャレンジ・イベント関連のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";

export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  hostUserId: int("hostUserId"),
  hostTwitterId: varchar("hostTwitterId", { length: 64 }),
  hostName: varchar("hostName", { length: 255 }).notNull(),
  hostUsername: varchar("hostUsername", { length: 255 }),
  hostProfileImage: text("hostProfileImage"),
  hostFollowersCount: int("hostFollowersCount").default(0),
  hostDescription: text("hostDescription"),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  goalType: mysqlEnum("goalType", ["attendance", "followers", "viewers", "points", "custom"]).default("attendance").notNull(),
  goalValue: int("goalValue").default(100).notNull(),
  goalUnit: varchar("goalUnit", { length: 32 }).default("人").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  eventType: mysqlEnum("eventType", ["solo", "group"]).default("solo").notNull(),
  categoryId: int("categoryId"),
  eventDate: timestamp("eventDate").notNull(),
  venue: varchar("venue", { length: 255 }),
  prefecture: varchar("prefecture", { length: 32 }),
  ticketPresale: int("ticketPresale"),
  ticketDoor: int("ticketDoor"),
  ticketSaleStart: timestamp("ticketSaleStart"),
  ticketUrl: text("ticketUrl"),
  externalUrl: text("externalUrl"),
  status: mysqlEnum("status", ["upcoming", "active", "ended"]).default("active").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  aiSummary: text("aiSummary"),
  intentTags: json("intentTags").$type<string[]>(),
  regionSummary: json("regionSummary").$type<Record<string, number>>(),
  participantSummary: json("participantSummary").$type<{
    totalCount: number;
    topContributors: Array<{ name: string; contribution: number; message?: string }>;
    recentMessages: Array<{ name: string; message: string; createdAt: string }>;
    hotRegion?: string;
  }>(),
  aiSummaryUpdatedAt: timestamp("aiSummaryUpdatedAt"),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export const events = challenges;
export type Event = Challenge;
export type InsertEvent = InsertChallenge;

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  icon: varchar("icon", { length: 32 }).default("🎤").notNull(),
  color: varchar("color", { length: 16 }).default("#EC4899").notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const challengeTemplates = mysqlTable("challenge_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  goalType: mysqlEnum("goalType", ["attendance", "followers", "viewers", "points", "custom"]).default("attendance").notNull(),
  goalValue: int("goalValue").default(100).notNull(),
  goalUnit: varchar("goalUnit", { length: 32 }).default("人").notNull(),
  eventType: mysqlEnum("eventType", ["solo", "group"]).default("solo").notNull(),
  ticketPresale: int("ticketPresale"),
  ticketDoor: int("ticketDoor"),
  isPublic: boolean("isPublic").default(false).notNull(),
  useCount: int("useCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChallengeTemplate = typeof challengeTemplates.$inferSelect;
export type InsertChallengeTemplate = typeof challengeTemplates.$inferInsert;

export const challengeStats = mysqlTable("challenge_stats", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  recordDate: varchar("recordDate", { length: 10 }).notNull(),
  recordHour: int("recordHour").default(0).notNull(),
  participantCount: int("participantCount").default(0).notNull(),
  totalContribution: int("totalContribution").default(0).notNull(),
  newParticipants: int("newParticipants").default(0).notNull(),
  prefectureData: text("prefectureData"), // Keeps JSON string or text content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeStat = typeof challengeStats.$inferSelect;
export type InsertChallengeStat = typeof challengeStats.$inferInsert;

export const challengeMembers = mysqlTable("challenge_members", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  twitterUsername: varchar("twitterUsername", { length: 255 }).notNull(),
  twitterId: varchar("twitterId", { length: 64 }),
  displayName: varchar("displayName", { length: 255 }),
  profileImage: text("profileImage"),
  followersCount: int("followersCount").default(0),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChallengeMember = typeof challengeMembers.$inferSelect;
export type InsertChallengeMember = typeof challengeMembers.$inferInsert;
