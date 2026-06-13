/**
 * Gamification-related Schema Tables
 *
 * バッジ・アチーブメント・達成記念ページ関連のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("iconUrl"),
  type: mysqlEnum("type", ["participation", "achievement", "milestone", "special"]).default("participation").notNull(),
  conditionType: mysqlEnum("conditionType", [
    "first_participation", "goal_reached", "milestone_25", "milestone_50", "milestone_75",
    "contribution_5", "contribution_10", "contribution_20", "host_challenge", "special", "follower_badge",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  challengeId: int("challengeId"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("iconUrl"),
  icon: varchar("icon", { length: 32 }).default("🏆").notNull(),
  type: mysqlEnum("type", ["participation", "hosting", "invitation", "contribution", "streak", "special"]).default("participation").notNull(),
  conditionType: mysqlEnum("conditionType", [
    "first_participation", "participate_5", "participate_10", "participate_25", "participate_50",
    "first_host", "host_5", "host_10", "invite_1", "invite_5", "invite_10", "invite_25",
    "contribution_10", "contribution_50", "contribution_100", "streak_3", "streak_7", "streak_30",
    "goal_reached", "special",
  ]).notNull(),
  conditionValue: int("conditionValue").default(1).notNull(),
  points: int("points").default(10).notNull(),
  rarity: mysqlEnum("rarity", ["common", "uncommon", "rare", "epic", "legendary"]).default("common").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  progress: int("progress").default(0).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

export const achievementPages = mysqlTable("achievement_pages", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  achievedAt: timestamp("achievedAt").notNull(),
  finalValue: int("finalValue").notNull(),
  goalValue: int("goalValue").notNull(),
  totalParticipants: int("totalParticipants").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AchievementPage = typeof achievementPages.$inferSelect;
export type InsertAchievementPage = typeof achievementPages.$inferInsert;

export const pickedComments = mysqlTable("picked_comments", {
  id: int("id").autoincrement().primaryKey(),
  participationId: int("participationId").notNull(),
  challengeId: int("challengeId").notNull(),
  pickedBy: int("pickedBy").notNull(),
  reason: text("reason"),
  isUsedInVideo: boolean("isUsedInVideo").default(false).notNull(),
  pickedAt: timestamp("pickedAt").defaultNow().notNull(),
});

export type PickedComment = typeof pickedComments.$inferSelect;
export type InsertPickedComment = typeof pickedComments.$inferInsert;
