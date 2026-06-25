import type { VercelRequest, VercelResponse } from "@vercel/node";
import { APP_VERSION } from "../shared/version.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "surechigai-romi-api",
    version: APP_VERSION,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    checkedAt: new Date().toISOString(),
  });
}
