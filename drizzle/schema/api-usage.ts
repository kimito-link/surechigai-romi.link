/**
 * API Usage Tracking Schema
 *
 * X API（旧Twitter API）の使用量とコストを追跡するテーブル
 */

import { mysqlTable, int, varchar, timestamp, decimal, json, index } from "drizzle-orm/mysql-core";

// =============================================================================
// API Usage Table
// =============================================================================

/**
 * API呼び出し記録テーブル
 */
export const apiUsage = mysqlTable(
  "api_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    method: varchar("method", { length: 10 }).default("GET").notNull(),
    success: int("success").default(1).notNull(),
    cost: decimal("cost", { precision: 10, scale: 4 }).default("0").notNull(),
    rateLimitInfo: json("rateLimitInfo"),
    month: varchar("month", { length: 7 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    monthIdx: index("month_idx").on(table.month),
    endpointIdx: index("endpoint_idx").on(table.endpoint),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = typeof apiUsage.$inferInsert;

// =============================================================================
// API Cost Settings Table
// =============================================================================

export const apiCostSettings = mysqlTable("api_cost_settings", {
  id: int("id").autoincrement().primaryKey(),
  monthlyLimit: decimal("monthlyLimit", { precision: 10, scale: 2 }).default("10.00").notNull(),
  alertThreshold: decimal("alertThreshold", { precision: 10, scale: 2 }).default("8.00").notNull(),
  alertEmail: varchar("alertEmail", { length: 320 }),
  autoStop: int("autoStop").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiCostSettings = typeof apiCostSettings.$inferSelect;
export type InsertApiCostSettings = typeof apiCostSettings.$inferInsert;
