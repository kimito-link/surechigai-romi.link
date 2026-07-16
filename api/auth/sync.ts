/**
 * Clerk ログイン後のユーザープロフィール同期（Vercel Functions）。
 * X username / twitterUserCache / shareSlug を DB に反映する。
 * 実処理は server/clerk-auth-sync.ts に共通化されている
 * (dev用Expressサーバーの同エンドポイントと共有・乖離防止)。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { syncClerkAuthFromBearerToken } = await import(
    "../../server/clerk-auth-sync.js"
  );
  const result = await syncClerkAuthFromBearerToken(req.headers.authorization);
  res.status(result.status).json(result.body);
}
