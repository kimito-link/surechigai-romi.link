import type { VercelRequest, VercelResponse } from "@vercel/node";
import { APP_VERSION } from "../shared/version.js";
import { buildHealthStatus, measureDbLatency } from "../lib/health-status.js";

/**
 * ?db=1 が付いたときだけ DB round-trip（SELECT 1）を実測してレスポンスに含める。
 * 常時計測しない理由: このエンドポイントは deploy-verify.yml / gate1.yml から
 * 高頻度で叩かれるため、既定では従来どおり軽量（DB接続確認のみ）に保つ。
 * Vercel⇄Railwayレイテンシ調査（次の検証ステップ）用のオプトイン計測。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const health = buildHealthStatus();
  const shouldMeasureDb = req.query?.db === "1";
  const dbLatency = shouldMeasureDb ? await measureDbLatency() : undefined;

  res.status(health.ok ? 200 : 503).json({
    ...health,
    version: APP_VERSION,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    ...(dbLatency ? { dbLatency } : {}),
  });
}
