import type { VercelRequest, VercelResponse } from "@vercel/node";
import { APP_VERSION } from "../shared/version.js";
import { buildHealthStatus } from "../lib/health-status.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const health = buildHealthStatus();
  res.status(health.ok ? 200 : 503).json({
    ...health,
    version: APP_VERSION,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
  });
}
