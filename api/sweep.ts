/**
 * GitHub Actions スイープ専用エンドポイント（Vercel Functions）。
 * SWEEP_SECRET ヘッダー照合 + 日次ヘルスチェック + DB成長スナップショット。
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
    const { recordDbGrowthSnapshot, recordUsageSnapshot } = await import(
      "../server/db-growth-alert.js"
    );

    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "DB unavailable" });
      return;
    }

    // 日次ヘルスチェック。Railway PGのkeepalive目的ではなく接続確認として残す。
    const { sql: rawSql } = await import("drizzle-orm");
    await db.execute(rawSql`SELECT 1`);

    const dbGrowth = await recordDbGrowthSnapshot(db);

    // 利用状況の日次スナップショット。★失敗しても sweep 全体を落とさない
    // （DB成長の監視が本来の役割で、そちらを巻き添えにしない）。
    let usage: Awaited<ReturnType<typeof recordUsageSnapshot>> | null = null;
    let usageError: string | null = null;
    try {
      usage = await recordUsageSnapshot(db);
    } catch (err) {
      usageError = err instanceof Error ? err.message : String(err);
      console.error("[sweep] usageSnapshot failed:", usageError);
    }

    console.log("[sweep] dbGrowth", dbGrowth);
    console.log("[sweep] usage", usage ?? `失敗: ${usageError}`);

    res.status(200).json({
      ok: true,
      dbGrowth,
      // ★null なら「測れなかった」。0 件と区別できるようにする
      usage,
      usageError,
      sweptAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/sweep] Error:", err);
    res.status(500).json({ error: String(err) });
  }
}
