/**
 * 認証セッションが開く受け渡し口（Vercel Functions）。
 * 実処理は server/native-auth-handoff.ts。開発用 Express も同じ関数を呼ぶ。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleNativeAuthHandoff } from "../../server/native-auth-handoff.js";

function apply(res: VercelResponse, result: Awaited<ReturnType<typeof handleNativeAuthHandoff>>) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (result.kind === "redirect") {
    res.status(result.status);
    res.setHeader("Location", result.location);
    res.end();
    return;
  }
  if (result.kind === "html") {
    res.status(result.status);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(result.html);
    return;
  }
  res.status(result.status).json({ error: result.message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const tried = req.query?.tried === "1" || req.query?.tried === "true";
  const cookieHeader = typeof req.headers.cookie === "string" ? req.headers.cookie : undefined;
  const result = await handleNativeAuthHandoff({ cookieHeader, tried });
  apply(res, result);
}
