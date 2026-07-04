/**
 * GitHub Actions スイープ専用エンドポイント（Vercel Functions）。
 * SWEEP_SECRET ヘッダー照合 + DB keepalive + 取りこぼしマッチング回収。
 * 方針: locations は削除しない（思い出の軌跡として永続保存）。
 * deleteExpiredLocations は互換のため呼ぶが常に0件（実削除しない）。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sweepSecret = process.env.SWEEP_SECRET;
  const provided = req.headers["x-sweep-secret"];

  if (!sweepSecret || provided !== sweepSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { getDb } = await import("../server/db/connection.js");
    const { deleteExpiredLocations, getRecentLocationUserIds } = await import(
      "../modules/encounter/db/queries.js"
    );

    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "DB unavailable" });
      return;
    }

    // 1. locations は削除しない（永続保存方針）。互換のため呼ぶが常に0件。
    const deletedLocations = await deleteExpiredLocations(db);

    // 2. Railway PostgreSQL keepalive（SELECT 1 で接続維持）
    const { sql: rawSql } = await import("drizzle-orm");
    await db.execute(rawSql`SELECT 1`);

    // 3. 取りこぼしマッチングのユーザーリストを取得
    //    （実際のマッチングロジックはスコープが大きいため、ここでは件数のみ返す）
    const recentUserIds = await getRecentLocationUserIds(db);

    console.log(`[sweep] deletedLocations=${deletedLocations}, recentUsers=${recentUserIds.length}`);

    res.status(200).json({
      ok: true,
      deletedLocations,
      recentUsersCount: recentUserIds.length,
      sweptAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/sweep] Error:", err);
    res.status(500).json({ error: String(err) });
  }
}
