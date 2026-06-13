/**
 * Notification-related Schema Tables
 *
 * 通知設定・履歴・リマインダー関連のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  onGoalReached: boolean("onGoalReached").default(true).notNull(),
  onMilestone25: boolean("onMilestone25").default(true).notNull(),
  onMilestone50: boolean("onMilestone50").default(true).notNull(),
  onMilestone75: boolean("onMilestone75").default(true).notNull(),
  onNewParticipant: boolean("onNewParticipant").default(false).notNull(),
  expoPushToken: text("expoPushToken"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  type: mysqlEnum("type", ["goal_reached", "milestone_25", "milestone_50", "milestone_75", "new_participant"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  reminderType: mysqlEnum("reminderType", ["day_before", "day_of", "hour_before", "custom"]).default("day_before").notNull(),
  customTime: timestamp("customTime"),
  isSent: boolean("isSent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;
