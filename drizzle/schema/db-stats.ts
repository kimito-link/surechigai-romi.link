/**
 * DB growth monitoring snapshots.
 *
 * Daily sweep records approximate table/database sizes without running COUNT(*).
 */

import {
  bigint,
  index,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const dbStatsSnapshots = pgTable(
  "db_stats_snapshots",
  {
    id: serial("id").primaryKey(),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
    locationsBytes: bigint("locationsBytes", { mode: "number" }).notNull(),
    locationsRows: bigint("locationsRows", { mode: "number" }).notNull(),
    totalDbBytes: bigint("totalDbBytes", { mode: "number" }).notNull(),
  },
  (table) => [
    index("db_stats_snapshots_capturedAt_idx").on(table.capturedAt),
  ],
);

export type DbStatsSnapshot = typeof dbStatsSnapshots.$inferSelect;
export type InsertDbStatsSnapshot = typeof dbStatsSnapshots.$inferInsert;
