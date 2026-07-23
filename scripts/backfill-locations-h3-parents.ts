/**
 * locations.h3R7 / h3R5 のバックフィル（h3R8 から cellToParent で導出）。
 * マッチングティア再設計（docs/matching-tier-redesign-DESIGN.md）Phase1の一部。
 * Usage: node --import tsx scripts/backfill-locations-h3-parents.ts
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const { getDb } = await import("../server/db/connection.js");
  const { locations } = await import("../drizzle/schema/index.js");
  const { toH3ParentCell, H3_RES_7, H3_RES_5 } = await import(
    "../modules/encounter/core/geo.js"
  );
  const { isNull, eq, sql } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL 未設定または DB 接続不可");
    process.exit(1);
  }

  const rows = await db
    .select({ id: locations.id, h3R8: locations.h3R8 })
    .from(locations)
    .where(isNull(locations.h3R7));

  console.log(`バックフィル対象: ${rows.length}件`);

  let updated = 0;
  for (const row of rows) {
    const h3R7 = toH3ParentCell(row.h3R8, H3_RES_7);
    const h3R5 = toH3ParentCell(row.h3R8, H3_RES_5);
    await db
      .update(locations)
      .set({ h3R7, h3R5 })
      .where(eq(locations.id, row.id));
    updated++;
  }

  console.log(`完了: ${updated}件を更新しました`);

  const [remaining] = await db
    .select({ count: sql<number>`count(*)` })
    .from(locations)
    .where(isNull(locations.h3R7));
  console.log(`残NULL件数: ${remaining?.count ?? 0}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("バックフィル失敗:", error);
  process.exit(1);
});
