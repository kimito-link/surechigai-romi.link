/**
 * 認証関連のAPIルート
 * 
 * 注意: Manus OAuth Portal経由のルート（/api/oauth/callback, /api/oauth/mobile）は
 * 現在使用されていないため削除済み。ログインはTwitter OAuth 2.0のみ使用。
 * 
 * 残存ルート:
 * - POST /api/auth/logout - ログアウト（サーバーサイドトークン無効化を含む）
 * - GET  /api/auth/me     - 現在の認証ユーザー取得
 * - POST /api/auth/session - Bearerトークンからセッション Cookie を確立
 */
import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { revokeToken } from "../twitter-oauth2";
import { getTokens, deleteTokens } from "../token-store";
import { clearActivity } from "./sdk";

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
        prefecture?: string | null;
        gender?: "male" | "female" | "unspecified" | null;
        role?: "user" | "admin" | null;
      },
) {
  const u = user as any;
  return {
    id: u?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
    prefecture: u?.prefecture ?? null,
    gender: u?.gender ?? null,
    role: u?.role ?? null,
  };
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    // 1. セッションCookieをクリア
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.clearCookie("admin_session", { ...cookieOptions, maxAge: -1 });

    // 2. サーバーサイドのTwitterトークンをリボーク + 削除（BFFパターン）
    try {
      const user = await sdk.authenticateRequest(req).catch(() => null);
      if (user) {
        const storedTokens = await getTokens(user.openId);
        // fire-and-forget: refresh_token → access_token の順にリボーク
        // ZIPリファレンス準拠: 両トークンを確実に無効化
        if (storedTokens?.refreshToken) {
          revokeToken(storedTokens.refreshToken, "refresh_token").catch(() => {});
        }
        if (storedTokens?.accessToken) {
          revokeToken(storedTokens.accessToken, "access_token").catch(() => {});
        }
        // サーバーサイドのトークンストアから削除
        await deleteTokens(user.openId).catch(() => {});
        // アイドルタイムアウト記録もクリア
        clearActivity(user.openId);
      }
    } catch {
      // ログアウト自体は必ず成功させる
    }

    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      // 内部エラー詳細はユーザーに露出しない
      console.error("[Auth] /api/auth/me failed:", error instanceof Error ? error.message : "unknown");
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by Twitter OAuth callback to establish session on web platform
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);

      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Webプラットフォームからのリクエストの場合、クロスサイトリクエストに対応
      const cookieOptions = getSessionCookieOptions(req, { crossSite: true });
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error instanceof Error ? error.message : "unknown");
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
