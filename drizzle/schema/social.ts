/**
 * Social-related Schema Tables
 *
 * エール・フォロー・DM・検索履歴関連のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";

export const cheers = mysqlTable("cheers", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  fromUserName: varchar("fromUserName", { length: 255 }).notNull(),
  fromUserImage: text("fromUserImage"),
  toParticipationId: int("toParticipationId").notNull(),
  toUserId: int("toUserId"),
  message: text("message"),
  emoji: varchar("emoji", { length: 32 }).default("👏").notNull(),
  challengeId: int("challengeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Cheer = typeof cheers.$inferSelect;
export type InsertCheer = typeof cheers.$inferInsert;

export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followerName: varchar("followerName", { length: 255 }),
  followeeId: int("followeeId").notNull(),
  followeeName: varchar("followeeName", { length: 255 }),
  followeeImage: text("followeeImage"),
  notifyNewChallenge: boolean("notifyNewChallenge").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

export const directMessages = mysqlTable("direct_messages", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  fromUserName: varchar("fromUserName", { length: 255 }).notNull(),
  fromUserImage: text("fromUserImage"),
  toUserId: int("toUserId").notNull(),
  message: text("message").notNull(),
  challengeId: int("challengeId").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;

export const searchHistory = mysqlTable("search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  resultCount: int("resultCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

export const favoriteArtists = mysqlTable("favorite_artists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userTwitterId: varchar("userTwitterId", { length: 64 }),
  artistTwitterId: varchar("artistTwitterId", { length: 64 }).notNull(),
  artistName: varchar("artistName", { length: 255 }),
  artistUsername: varchar("artistUsername", { length: 255 }),
  artistProfileImage: text("artistProfileImage"),
  notifyNewChallenge: boolean("notifyNewChallenge").default(true).notNull(),
  expoPushToken: text("expoPushToken"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FavoriteArtist = typeof favoriteArtists.$inferSelect;
export type InsertFavoriteArtist = typeof favoriteArtists.$inferInsert;
