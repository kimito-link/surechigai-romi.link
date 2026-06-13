/**
 * User-related Schema Tables
 *
 * ユーザー認証・プロフィール関連のテーブル定義
 * すれちがいロミ: pg-core (Supabase Postgres) 版
 */

import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  serial,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// =============================================================================
// Users Table
// =============================================================================

/**
 * Core user table backing auth flow.
 * すれちがいロミ追加カラム: hitokoto, hitokotoUpdatedAt, isSuspended
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // ENUM → text + CHECK
  role: text("role").default("user").notNull(),
  gender: text("gender").default("unspecified").notNull(),
  prefecture: varchar("prefecture", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // すれちがいロミ: ひとこと（24h経過で非表示はクエリ側で判定）
  hitokoto: text("hitokoto"),
  hitokotoUpdatedAt: timestamp("hitokotoUpdatedAt"),
  // すれちがいロミ: 通報3件自動停止フラグ
  isSuspended: boolean("isSuspended").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// =============================================================================
// Twitter Follow Status Table
// =============================================================================

export const twitterFollowStatus = pgTable("twitter_follow_status", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  twitterId: varchar("twitterId", { length: 64 }).notNull(),
  twitterUsername: varchar("twitterUsername", { length: 255 }),
  targetTwitterId: varchar("targetTwitterId", { length: 64 }).notNull(),
  targetUsername: varchar("targetUsername", { length: 255 }).notNull(),
  isFollowing: boolean("isFollowing").default(false).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TwitterFollowStatus = typeof twitterFollowStatus.$inferSelect;
export type InsertTwitterFollowStatus = typeof twitterFollowStatus.$inferInsert;

// =============================================================================
// OAuth PKCE Data Table
// =============================================================================

export const oauthPkceData = pgTable("oauth_pkce_data", {
  id: serial("id").primaryKey(),
  state: varchar("state", { length: 64 }).notNull().unique(),
  codeVerifier: varchar("codeVerifier", { length: 128 }).notNull(),
  callbackUrl: text("callbackUrl").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OAuthPkceData = typeof oauthPkceData.$inferSelect;
export type InsertOAuthPkceData = typeof oauthPkceData.$inferInsert;

// =============================================================================
// Twitter User Cache Table
// =============================================================================

export const twitterUserCache = pgTable("twitter_user_cache", {
  id: serial("id").primaryKey(),
  twitterUsername: varchar("twitterUsername", { length: 255 }).notNull().unique(),
  twitterId: varchar("twitterId", { length: 64 }),
  displayName: varchar("displayName", { length: 255 }),
  profileImage: text("profileImage"),
  followersCount: integer("followersCount").default(0),
  description: text("description"),
  cachedAt: timestamp("cachedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TwitterUserCache = typeof twitterUserCache.$inferSelect;
export type InsertTwitterUserCache = typeof twitterUserCache.$inferInsert;

// =============================================================================
// User Twitter Tokens Table (BFF Pattern - サーバーサイドトークン管理)
// =============================================================================

export const userTwitterTokens = pgTable("user_twitter_tokens", {
  id: serial("id").primaryKey(),
  /** users.openId と紐付け（例: "twitter:12345"） */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  /** AES-256-GCM 暗号化済みアクセストークン (hex: iv + authTag + ciphertext) */
  encryptedAccessToken: text("encryptedAccessToken").notNull(),
  /** AES-256-GCM 暗号化済みリフレッシュトークン */
  encryptedRefreshToken: text("encryptedRefreshToken"),
  /** アクセストークン有効期限 */
  tokenExpiresAt: timestamp("tokenExpiresAt").notNull(),
  /** 付与されたスコープ */
  scope: varchar("scope", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserTwitterTokens = typeof userTwitterTokens.$inferSelect;
export type InsertUserTwitterTokens = typeof userTwitterTokens.$inferInsert;
