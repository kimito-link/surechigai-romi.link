/**
 * 凍結共有カードの読み書き。公開レスポンスへ番地や生座標は載せない。
 */
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../drizzle/schema/index.js";
import { shareCards, type InsertShareCard } from "../../drizzle/schema/share-cards.js";

type DB = PostgresJsDatabase<typeof schema>;

export async function insertShareCard(db: DB, row: InsertShareCard): Promise<void> {
  await db.insert(shareCards).values(row);
}

export async function getShareCardById(db: DB, id: string) {
  const rows = await db.select().from(shareCards).where(eq(shareCards.id, id)).limit(1);
  return rows[0] ?? null;
}
