/**
 * Database Module Index
 * 
 * このファイルは分割されたデータベース関数を再エクスポートします。
 * 既存のimport { ... } from "../db" を維持するための互換性レイヤーです。
 */

// Connection & utilities
export { getDb, generateSlug, eq, desc, sql, and, ne, or, isNull, asc, like, inArray, gte, lte, count } from "./connection";

// User functions
export * from "./user-db";

// Challenge/Event functions
export * from "./challenge-db";

// Participation functions
export * from "./participation-db";

// Notification functions
export * from "./notification-db";

// Badge functions
export * from "./badge-db";

// Social functions (cheers, comments, achievement pages)
export * from "./social-db";

// Messaging functions (reminders, DM, templates)
export * from "./messaging-db";

// Follow & search functions
export * from "./follow-db";

// Ranking functions
export * from "./ranking-db";

// Category functions
export * from "./category-db";

// Invitation functions
export * from "./invitation-db";

// Profile functions
export * from "./profile-db";

// Companion functions
export * from "./companion-db";

// AI functions
export * from "./ai-db";

// Ticket functions
export * from "./ticket-db";

// Stats functions
export * from "./stats-db";

// Audit functions
export * from "./audit-db";
