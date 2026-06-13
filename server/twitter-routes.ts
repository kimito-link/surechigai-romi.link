import { Express, Request, Response } from "express";
import {
  generatePKCE,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getUserProfile,
  storePKCEData,
  getPKCEData,
  deletePKCEData,
  checkFollowStatus,
  getTargetAccountInfo,
  getUserProfileByUsername,
  refreshAccessToken,
} from "./twitter-oauth2";
import * as db from "./db";
import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { sdk } from "./_core/sdk.js";
import { storeTokens, getValidAccessToken as getStoredAccessToken, deleteTokens } from "./token-store";
import {
  getClientIp,
  getClientUserAgent,
  writeLoginAuditLog,
  isLoginLocked,
  recordLoginFailure,
  resetLoginFailures,
  setLoginCooldown,
  isInLoginCooldown,
} from "./login-security";

/**
 * エラーレスポンスを生成（本番環境では詳細情報を除外）
 * 
 * @internal テスト用にexport（本来はprivate関数）
 */
export function createErrorResponse(error: unknown, includeDetails: boolean = false): {
  error: boolean;
  message: string;
  details?: string;
} {
  const isProduction = process.env.NODE_ENV === "production";
  
  let errorMessage = "Failed to complete Twitter authentication";
  let errorDetails = "";
  
  if (error instanceof Error) {
    errorMessage = error.message;
    // 本番環境ではスタックトレースを含めない
    errorDetails = includeDetails && !isProduction ? error.stack || "" : "";
  } else if (typeof error === "string") {
    errorMessage = error;
  }
  
  return {
    error: true,
    message: errorMessage,
    ...(errorDetails && { details: errorDetails.substring(0, 200) }),
  };
}

/**
 * Bearerトークンの安全な取得
 * 
 * @internal テスト用にexport（本来はprivate関数）
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  // Bearer トークンの形式を検証
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]?.trim()) {
    return null;
  }
  
  return match[1].trim();
}

export function registerTwitterRoutes(app: Express) {
  // Step 1: Initiate Twitter OAuth 2.0
  app.get("/api/twitter/auth", async (req: Request, res: Response) => {
    try {
      // ログイン失敗回数制限チェック
      const clientIp = getClientIp(req);
      const lockStatus = isLoginLocked(clientIp);
      if (lockStatus.locked) {
        res.status(429).json({
          error: `ログイン試行回数が上限に達しました。${lockStatus.remainingSeconds}秒後に再試行してください。`,
        });
        return;
      }

      // 別のアカウントでログインするかどうかのフラグ
      const forceLogin = req.query.force === "true" || req.query.switch === "true";
      
      // Build callback URL - force https for production environments
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || req.get("host")?.includes("manus.computer");
      const callbackUrl = `${forceHttps ? "https" : protocol}://${req.get("host")}/api/twitter/callback`;
      
      // Generate PKCE parameters
      const { codeVerifier, codeChallenge } = generatePKCE();
      const state = generateState();
      
      // Store PKCE data for callback
      await storePKCEData(state, codeVerifier, callbackUrl);
      
      // Build authorization URL (forceLoginで別アカウントでログイン可能)
      const authUrl = buildAuthorizationUrl(callbackUrl, state, codeChallenge, forceLogin);
      
      // Redirect to Twitter authorization page（URLはトークン漏洩防止のためログに出さない）
      res.redirect(authUrl);
    } catch (error) {
      console.error("[Twitter Auth] Init error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "ログインの開始に失敗しました" });
    }
  });

  // Step 2: Handle Twitter OAuth 2.0 callback
  app.get("/api/twitter/callback", async (req: Request, res: Response) => {
    const callbackIp = getClientIp(req);
    const callbackUa = getClientUserAgent(req);

    try {
      const { code, state, error: oauthError, error_description } = req.query as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
      };

      // Handle OAuth errors (e.g., user cancelled authorization)
      if (oauthError) {
        // 監査ログ: OAuth認証エラー
        writeLoginAuditLog({
          openId: "unknown",
          success: false,
          ip: callbackIp,
          userAgent: callbackUa,
          failureReason: `OAuth error: ${oauthError}`,
        }).catch(() => {});
        if (oauthError !== "access_denied") recordLoginFailure(callbackIp);
        
        // Build redirect URL to frontend app with error info
        const host = req.get("host") || "";
        const protocol = req.get("x-forwarded-proto") || req.protocol;
        const forceHttps = protocol === "https" || host.includes("manus.computer") || host.includes("railway.app");
        
        // Production: redirect to doin-challenge.com
        // Development: redirect to Expo app (port 8081)
        let baseUrl: string;
        if (host.includes("railway.app")) {
          baseUrl = "https://doin-challenge.com";
        } else {
          const expoHost = host.replace("3000-", "8081-");
          baseUrl = `${forceHttps ? "https" : protocol}://${expoHost}`;
        }
        
        // Encode error data for redirect（本番環境では詳細情報を除外）
        const errorResponse = createErrorResponse(
          {
            message: oauthError === "access_denied" 
              ? "認証がキャンセルされました" 
              : error_description || "Twitter認証中にエラーが発生しました",
            code: oauthError,
          },
          false // 本番環境では詳細情報を含めない
        );
        const errorData = encodeURIComponent(JSON.stringify({
          ...errorResponse,
          code: oauthError,
        }));
        
        // Redirect to Expo app with error
        res.redirect(`${baseUrl}/oauth/twitter-callback?error=${errorData}`);
        return;
      }

      if (!code || !state) {
        recordLoginFailure(callbackIp);
        writeLoginAuditLog({ openId: "unknown", success: false, ip: callbackIp, userAgent: callbackUa, failureReason: "Missing code/state" }).catch(() => {});
        res.status(400).json({ error: "Missing code or state parameter" });
        return;
      }

      // Retrieve stored PKCE data
      const pkceData = await getPKCEData(state);
      if (!pkceData) {
        recordLoginFailure(callbackIp);
        writeLoginAuditLog({ openId: "unknown", success: false, ip: callbackIp, userAgent: callbackUa, failureReason: "Invalid/expired state" }).catch(() => {});
        res.status(400).json({ error: "Invalid or expired state parameter" });
        return;
      }

      const { codeVerifier, callbackUrl } = pkceData;

      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code, callbackUrl, codeVerifier);
      
      // トークン交換成功（トークン値はログに出力しない）

      // Clean up stored PKCE data (background, don't wait)
      setImmediate(() => deletePKCEData(state).catch(() => {}));

      // Get user profile using access token
      const userProfile = await getUserProfile(tokens.access_token);
      
      // ユーザープロフィール取得成功

      // フォローチェックはログイン後に非同期で行うため、ここではスキップ
      // フロントエンドから /api/twitter/follow-status を呼び出して確認する
      const isFollowingTarget = false; // 後で確認
      const targetAccount = null; // 後で確認
      // フォローチェックはログイン後に非同期実行
      
      // Build user data object（BFFパターン: トークンはクライアントに渡さない）
      const userData = {
        twitterId: userProfile.id,
        name: userProfile.name,
        username: userProfile.username,
        profileImage: userProfile.profile_image_url?.replace("_normal", "_400x400"),
        followersCount: userProfile.public_metrics?.followers_count || 0,
        followingCount: userProfile.public_metrics?.following_count || 0,
        description: userProfile.description || "",
        // 注意: accessToken, refreshToken はセキュリティ上クライアントに送らない
        isFollowingTarget,
        targetAccount,
      };
      
      // Save user profile to database（リトライ付き）
      const openId = `twitter:${userProfile.id}`;

      // BFFパターン: トークンをサーバーサイドで暗号化して保存
      await storeTokens(openId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scope: tokens.scope,
      });
      let dbSaveSuccess = false;
      for (let dbRetry = 0; dbRetry < 2; dbRetry++) {
        try {
          await db.upsertUser({
            openId,
            name: userProfile.name,
            email: null,
            loginMethod: "twitter",
            lastSignedIn: new Date(),
          });
          // DB保存成功
          dbSaveSuccess = true;
          break;
        } catch (error) {
          console.error(`[Twitter Auth] DB save failed (attempt ${dbRetry + 1}/2):`, error instanceof Error ? error.message : "unknown");
          if (dbRetry === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      if (!dbSaveSuccess) {
        console.warn("[Twitter Auth] DB save failed after retries, continuing");
      }

      // ログイン成功: 監査ログ + 失敗カウンターリセット + API連打防止クールダウン
      resetLoginFailures(callbackIp);
      setLoginCooldown(openId);
      writeLoginAuditLog({
        openId,
        twitterId: userProfile.id,
        twitterUsername: userProfile.username,
        success: true,
        ip: callbackIp,
        userAgent: callbackUa,
      }).catch(() => {});

      // Create session token and set cookie (重要: セッションCookieを設定して認証状態を確立)
      // Twitter OAuthも外部サイトからのリダイレクトなので、クロスサイトリクエストに対応
      let sessionToken: string | undefined;
      let sessionError: string | undefined;
      for (let sessionRetry = 0; sessionRetry < 2; sessionRetry++) {
        try {
          sessionToken = await sdk.createSessionToken(openId, {
            name: userProfile.name || "",
            expiresInMs: SESSION_MAX_AGE_MS,
          });
          const cookieOptions = getSessionCookieOptions(req, { crossSite: true });
          res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
          // セッションCookie設定完了
          break;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[Twitter Auth] Session creation failed (attempt ${sessionRetry + 1}/2):`, msg);
          sessionError = msg;
          if (sessionRetry === 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      
      // セッション作成に完全に失敗した場合はエラーとしてリダイレクト
      if (!sessionToken) {
        console.error("[Twitter Auth] Session creation failed after retries");
        // ユーザーデータはあるが、セッション無しの警告付きでリダイレクト
        // フロントエンドで再認証フローを促す
      }

      // Encode user data for redirect
      const encodedData = encodeURIComponent(JSON.stringify(userData));
      
      // Build redirect URL - redirect to frontend app
      const host = req.get("host") || "";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || host.includes("manus.computer") || host.includes("railway.app");
      
      // Production: redirect to doin-challenge.com
      // Development: redirect to Expo app (port 8081)
      let baseUrl: string;
      if (host.includes("railway.app")) {
        baseUrl = "https://doin-challenge.com";
      } else {
        const expoHost = host.replace("3000-", "8081-");
        baseUrl = `${forceHttps ? "https" : protocol}://${expoHost}`;
      }
      
      // Redirect to Expo app callback page with user data and session token
      // WebプラットフォームでCookieが正しく設定されない場合に備えて、セッショントークンもURLパラメータとして渡す
      const redirectParams = new URLSearchParams({
        data: encodedData,
      });
      if (sessionToken) {
        redirectParams.set("sessionToken", sessionToken);
      }
      const redirectUrl = `${baseUrl}/oauth/twitter-callback?${redirectParams.toString()}`;
      // リダイレクトURLはトークン漏洩防止のため詳細をログに出さない
      res.redirect(redirectUrl);
    } catch (error: unknown) {
      console.error("[Twitter Auth] Callback error:", error instanceof Error ? error.message : "unknown");
      
      // エラーページにリダイレクト（ユーザーフレンドリーなエラー表示）
      const host = req.get("host") || "";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || host.includes("manus.computer") || host.includes("railway.app");
      
      // Production: redirect to doin-challenge.com
      // Development: redirect to Expo app (port 8081)
      let baseUrl: string;
      if (host.includes("railway.app")) {
        baseUrl = "https://doin-challenge.com";
      } else {
        const expoHost = host.replace("3000-", "8081-");
        baseUrl = `${forceHttps ? "https" : protocol}://${expoHost}`;
      }
      
      // エラー情報をエンコードしてリダイレクト（本番環境では詳細情報を除外）
      const errorResponse = createErrorResponse(error, process.env.NODE_ENV !== "production");
      const errorData = encodeURIComponent(JSON.stringify(errorResponse));
      
      res.redirect(`${baseUrl}/oauth/twitter-callback?error=${errorData}`);
    }
  });

  // API endpoint to get user profile (BFFパターン: サーバー保存トークンを使用)
  app.get("/api/twitter/me", async (req: Request, res: Response) => {
    try {
      // セッションからユーザーを認証
      const user = await sdk.authenticateRequest(req);
      const openId = user.openId;

      // サーバーサイドで保管したトークンを使用
      const accessToken = await getStoredAccessToken(openId);
      if (!accessToken) {
        res.status(401).json({ error: "Twitter token not found. Please re-login." });
        return;
      }

      const userProfile = await getUserProfile(accessToken);
      
      res.json({
        twitterId: userProfile.id,
        name: userProfile.name,
        username: userProfile.username,
        profileImage: userProfile.profile_image_url?.replace("_normal", "_400x400"),
        followersCount: userProfile.public_metrics?.followers_count || 0,
        followingCount: userProfile.public_metrics?.following_count || 0,
        description: userProfile.description || "",
      });
    } catch (error) {
      console.error("Twitter profile error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to get Twitter profile" });
    }
  });

  // API endpoint to check follow status (BFFパターン: サーバー保存トークンを使用)
  app.get("/api/twitter/follow-status", async (req: Request, res: Response) => {
    try {
      // セッションからユーザーを認証
      const user = await sdk.authenticateRequest(req);
      const openId = user.openId;
      const userId = req.query.userId as string;
      
      if (!userId) {
        res.status(400).json({ error: "Missing userId parameter" });
        return;
      }

      // ログイン直後のAPI連打防止（X API凍結リスク回避）
      if (isInLoginCooldown(openId)) {
        res.status(429).json({ error: "ログイン直後はしばらくお待ちください" });
        return;
      }

      // サーバーサイドで保管したトークンを使用（自動リフレッシュ付き）
      const accessToken = await getStoredAccessToken(openId);
      if (!accessToken) {
        res.status(401).json({ error: "Twitter token not found. Please re-login." });
        return;
      }

      const followStatus = await checkFollowStatus(accessToken, userId);
      const targetInfo = getTargetAccountInfo();
      
      res.json({
        isFollowing: followStatus.isFollowing,
        targetAccount: {
          ...targetInfo,
          ...followStatus.targetUser,
        },
      });
    } catch (error) {
      console.error("Follow status error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });

  // API endpoint to get target account info
  app.get("/api/twitter/target-account", async (req: Request, res: Response) => {
    try {
      const targetInfo = getTargetAccountInfo();
      res.json(targetInfo);
    } catch (error) {
      console.error("Target account error:", error);
      res.status(500).json({ error: "Failed to get target account info" });
    }
  });

  // API endpoint to lookup user profile by username
  // Supports: @username, username, https://x.com/username, https://twitter.com/username
  app.get("/api/twitter/user/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      
      if (!username) {
        res.status(400).json({ error: "Username is required" });
        return;
      }
      
      const profile = await getUserProfileByUsername(username);
      
      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImage: profile.profile_image_url,
        description: profile.description || "",
        followersCount: profile.public_metrics?.followers_count || 0,
        followingCount: profile.public_metrics?.following_count || 0,
      });
    } catch (error) {
      console.error("[Twitter] User lookup error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "ユーザー検索に失敗しました" });
    }
  });

  // API endpoint to refresh follow status (re-login required to get new token)
  // This endpoint triggers a re-authentication flow to check follow status
  app.get("/api/twitter/refresh-follow-status", async (req: Request, res: Response) => {
    try {
      // Build callback URL - force https for production environments
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || req.get("host")?.includes("manus.computer");
      const callbackUrl = `${forceHttps ? "https" : protocol}://${req.get("host")}/api/twitter/callback`;
      
      // Generate PKCE parameters
      const { codeVerifier, codeChallenge } = generatePKCE();
      const state = generateState();
      
      // Store PKCE data for callback
      await storePKCEData(state, codeVerifier, callbackUrl);
      
      // Build authorization URL
      const authUrl = buildAuthorizationUrl(callbackUrl, state, codeChallenge);
      
      // Redirect to Twitter authorization page
      res.redirect(authUrl);
    } catch (error) {
      console.error("[Twitter Auth] Refresh follow status error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "フォロー状態の更新に失敗しました" });
    }
  });

  // Token refresh endpoint (BFFパターン: サーバーサイドで完結)
  // クライアントはリフレッシュトークンを持たない。セッションCookieで認証し、
  // サーバーが保管したリフレッシュトークンで自動更新する。
  app.post("/api/twitter/refresh", async (req: Request, res: Response) => {
    try {
      // セッションからユーザーを認証
      const user = await sdk.authenticateRequest(req);
      const openId = user.openId;

      // サーバーサイドでトークンをリフレッシュ（getValidAccessTokenが自動で行う）
      const accessToken = await getStoredAccessToken(openId);
      
      if (!accessToken) {
        res.status(401).json({ error: "Token not found. Please re-login." });
        return;
      }

      // クライアントにはトークンの有無だけ返す（トークン自体は返さない）
      res.json({
        success: true,
        message: "Token refreshed server-side",
      });
    } catch (error) {
      console.error("Twitter token refresh error:", error instanceof Error ? error.message : "unknown");
      res.status(401).json({ error: "Failed to refresh token" });
    }
  });

  // API endpoint to lookup user profile by URL or username (POST for URL encoding)
  app.post("/api/twitter/lookup", async (req: Request, res: Response) => {
    try {
      const { input } = req.body as { input?: string };
      
      if (!input) {
        res.status(400).json({ error: "Input is required" });
        return;
      }
      
      const profile = await getUserProfileByUsername(input);
      
      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImage: profile.profile_image_url,
        description: profile.description || "",
        followersCount: profile.public_metrics?.followers_count || 0,
        followingCount: profile.public_metrics?.following_count || 0,
      });
    } catch (error) {
      console.error("[Twitter] Lookup error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "ユーザー検索に失敗しました" });
    }
  });
}
