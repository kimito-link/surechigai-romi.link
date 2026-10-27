/**
 * share_cards — シェア押下時に凍結したOGPカード。
 *
 * 公開してよいのは粗い地名（都道府県+市区町村）と、その場で描いて保存した画像URLだけ。
 * 番地・郵便番号・生座標は入れない。行は共有のたびに増え、退会時に所有者分を消す。
 */
import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const shareCards = pgTable(
  "share_cards",
  {
    id: varchar("id", { length: 16 }).primaryKey(),
    /** カードの所有者。退会削除の対象。 */
    userId: integer("userId").notNull(),
    /** 都道府県+市区町村。番地は入れない。 */
    areaText: varchar("areaText", { length: 80 }),
    title: varchar("title", { length: 200 }).notNull(),
    imageUrl: text("imageUrl").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("share_cards_userId_idx").on(table.userId)],
);

export type ShareCard = typeof shareCards.$inferSelect;
export type InsertShareCard = typeof shareCards.$inferInsert;
