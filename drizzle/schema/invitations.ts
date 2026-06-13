/**
 * Invitation-related Schema Tables
 *
 * チャレンジ招待・コラボ招待関連のテーブル定義
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  inviterId: int("inviterId").notNull(),
  inviterName: varchar("inviterName", { length: 255 }),
  code: varchar("code", { length: 32 }).notNull().unique(),
  customMessage: text("customMessage"),
  customTitle: varchar("customTitle", { length: 255 }),
  maxUses: int("maxUses").default(0),
  useCount: int("useCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

export const invitationUses = mysqlTable("invitation_uses", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull(),
  userId: int("userId"),
  displayName: varchar("displayName", { length: 255 }),
  twitterId: varchar("twitterId", { length: 64 }),
  twitterUsername: varchar("twitterUsername", { length: 255 }),
  participationId: int("participationId"),
  isConfirmed: boolean("isConfirmed").default(false).notNull(),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvitationUse = typeof invitationUses.$inferSelect;
export type InsertInvitationUse = typeof invitationUses.$inferInsert;

export const collaborators = mysqlTable("collaborators", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userImage: text("userImage"),
  role: mysqlEnum("role", ["owner", "co-host", "moderator"]).default("co-host").notNull(),
  canEdit: boolean("canEdit").default(true).notNull(),
  canManageParticipants: boolean("canManageParticipants").default(true).notNull(),
  canInvite: boolean("canInvite").default(true).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = typeof collaborators.$inferInsert;

export const collaboratorInvitations = mysqlTable("collaborator_invitations", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  inviterId: int("inviterId").notNull(),
  inviterName: varchar("inviterName", { length: 255 }),
  inviteeId: int("inviteeId"),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }),
  inviteeTwitterId: varchar("inviteeTwitterId", { length: 64 }),
  code: varchar("code", { length: 32 }).notNull().unique(),
  role: mysqlEnum("role", ["co-host", "moderator"]).default("co-host").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollaboratorInvitation = typeof collaboratorInvitations.$inferSelect;
export type InsertCollaboratorInvitation = typeof collaboratorInvitations.$inferInsert;
