import crypto from "crypto";
import { getDb } from "./db";
import { oauthPkceData } from "../drizzle/schema";
import { eq, lt } from "drizzle-orm";
import { twitterApiFetch, waitIfRateLimited } from "./rate-limit-handler";

// Twitter OAuth 2.0 with PKCE implementation
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || "";
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || "";

// Generate PKCE code verifier and challenge
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  
  // Generate code challenge using SHA256
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  
  return { codeVerifier, codeChallenge };
}

// Generate state for CSRF protection
// 32バイト (256ビット) のエントロピー（ZIPリファレンス準拠 / ガイド推奨: 128ビット以上）
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Build authorization URL
export function buildAuthorizationUrl(
  callbackUrl: string,
  state: string,
  codeChallenge: string,
  forceLogin: boolean = false
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: "users.read tweet.read follows.read offline.access",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  
  // force_loginパラメータを追加して別のアカウントでログインできるようにする
  // Twitter OAuth 2.0では prompt=login で強制的にログイン画面を表示
  // これによりブラウザにキャッシュされたセッションを無視して別のアカウントを選択可能
  if (forceLogin) {
    // prompt=login: 強制的にログイン画面を表示（セッションがあっても再認証を要求）
    params.set("prompt", "login");
    // タイムスタンプも追加してキャッシュを確実に無効化
    params.set("t", Date.now().toString());
  }
  
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

// リトライ付きfetch（指数バックオフ）
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: { maxRetries?: number; initialDelayMs?: number; timeoutMs?: number; label?: string } = {}
): Promise<Response> {
  const { maxRetries = 2, initialDelayMs = 500, timeoutMs = 15000, label = "API" } = config;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      // レート制限（429）の場合はリトライ
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : initialDelayMs * Math.pow(2, attempt);
        console.warn(`[${label}] Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      
      // 5xx サーバーエラーの場合はリトライ
      if (response.status >= 500 && attempt < maxRetries) {
        const waitMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`[${label}] Server error (${response.status}), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      
      return response;
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      const isNetwork = error instanceof TypeError && error.message.includes("fetch");
      
      if ((isAbort || isNetwork) && attempt < maxRetries) {
        const waitMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`[${label}] ${isAbort ? "Timeout" : "Network error"}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      
      if (isAbort) {
        throw new Error(`[${label}] Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
  
  // ここには到達しないが型安全のため
  throw new Error(`[${label}] All retry attempts exhausted`);
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  callbackUrl: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const url = "https://api.twitter.com/2/oauth2/token";
  
  const params = new URLSearchParams({
    code: code,
    grant_type: "authorization_code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: callbackUrl,
    code_verifier: codeVerifier,
  });
  
  // Create Basic auth header
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");
  
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: params.toString(),
  }, { maxRetries: 2, timeoutMs: 15000, label: "TokenExchange" });
  
  if (!response.ok) {
    const text = await response.text();
    // トークン値を含む可能性があるため、ステータスコードのみログに出力
    console.error("[TokenExchange] Error:", response.status);
    
    // エラー種別に応じた分かりやすいメッセージ
    if (response.status === 400) {
      throw new Error("認証コードが無効または期限切れです。もう一度ログインしてください。");
    }
    if (response.status === 401) {
      throw new Error("Twitter API認証に失敗しました。サーバー設定を確認してください。");
    }
    throw new Error(`Twitter認証トークンの取得に失敗しました (${response.status})`);
  }
  
  return response.json();
}

// Get user profile using OAuth 2.0 access token
export async function getUserProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  description: string;
}> {
  const url = "https://api.twitter.com/2/users/me";
  const params = "user.fields=profile_image_url,public_metrics,description";
  const fullUrl = `${url}?${params}`;
  
  const response = await fetchWithRetry(fullUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  }, { maxRetries: 2, timeoutMs: 10000, label: "UserProfile" });
  
  if (!response.ok) {
    await response.text(); // consume body
    console.error("[UserProfile] Error:", response.status);
    
    if (response.status === 401) {
      throw new Error("アクセストークンが無効です。もう一度ログインしてください。");
    }
    if (response.status === 429) {
      throw new Error("Twitter APIのレート制限に達しました。しばらく待ってから再試行してください。");
    }
    throw new Error(`ユーザープロフィールの取得に失敗しました (${response.status})`);
  }
  
  const json = await response.json();
  
  if (!json.data) {
    throw new Error("ユーザープロフィールデータが空です。Twitterアカウントの状態を確認してください。");
  }
  
  return json.data;
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const url = "https://api.twitter.com/2/oauth2/token";
  
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: TWITTER_CLIENT_ID,
  });
  
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");
  
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: params.toString(),
  }, { maxRetries: 1, timeoutMs: 10000, label: "TokenRefresh" });
  
  if (!response.ok) {
    await response.text(); // consume body
    console.error("[TokenRefresh] Error:", response.status);
    
    if (response.status === 400 || response.status === 401) {
      throw new Error(`INVALID_REFRESH_TOKEN: リフレッシュトークンが無効です。再ログインしてください。`);
    }
    throw new Error(`トークンの更新に失敗しました (${response.status})`);
  }
  
  return response.json();
}

// Store PKCE data - メモリ優先で高速化
// メモリに即座に保存し、バックグラウンドでデータベースにも保存
export async function storePKCEData(state: string, codeVerifier: string, callbackUrl: string): Promise<void> {
  // メモリに即座に保存（高速）
  // ガイド推奨: 5-10分。ユーザー体験のため30分に延長（Invalid or expired state 対策）
  const STATE_TTL_MS = 30 * 60 * 1000; // 30分
  pkceMemoryStore.set(state, { codeVerifier, callbackUrl });
  setTimeout(() => pkceMemoryStore.delete(state), STATE_TTL_MS);
  console.log("[PKCE] Stored PKCE data in memory for state:", state.substring(0, 8) + "...");
  
  // バックグラウンドでデータベースにも保存（失敗してもメモリがあるのでOK）
  setImmediate(async () => {
    try {
      const db = await getDb();
      if (!db) {
        console.log("[PKCE] Database not available, memory-only mode");
        return;
      }
      
      // Set expiration to 30 minutes from now (user experience; guide allows 5-10 min)
      const expiresAt = new Date(Date.now() + STATE_TTL_MS);
      
      // Clean up expired entries first (non-blocking)
      await db.delete(oauthPkceData).where(lt(oauthPkceData.expiresAt, new Date())).catch(() => {});
      
      // Insert new PKCE data
      await db.insert(oauthPkceData).values({
        state,
        codeVerifier,
        callbackUrl,
        expiresAt,
      });
      
      console.log("[PKCE] Also stored PKCE data in database for state:", state.substring(0, 8) + "...");
    } catch (error) {
      console.log("[PKCE] Database storage failed (memory fallback active):", error instanceof Error ? error.message : error);
    }
  });
}

// Get PKCE data from database
export async function getPKCEData(state: string): Promise<{ codeVerifier: string; callbackUrl: string } | undefined> {
  // Check memory store first (fallback)
  const memoryData = pkceMemoryStore.get(state);
  if (memoryData) {
    console.log("[PKCE] Retrieved PKCE data from memory for state:", state.substring(0, 8) + "...");
    return memoryData;
  }
  
  const db = await getDb();
  if (!db) {
    console.warn("[PKCE] Database not available");
    return undefined;
  }
  
  try {
    const result = await db.select().from(oauthPkceData).where(eq(oauthPkceData.state, state)).limit(1);
    
    if (result.length === 0) {
      console.log("[PKCE] No PKCE data found for state:", state.substring(0, 8) + "...");
      return undefined;
    }
    
    const data = result[0];
    
    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      console.log("[PKCE] PKCE data expired for state:", state.substring(0, 8) + "...");
      await deletePKCEData(state);
      return undefined;
    }
    
    console.log("[PKCE] Retrieved PKCE data for state:", state.substring(0, 8) + "...");
    return {
      codeVerifier: data.codeVerifier,
      callbackUrl: data.callbackUrl,
    };
  } catch (error) {
    console.error("[PKCE] Failed to get from database:", error);
    return undefined;
  }
}

// Delete PKCE data from database
export async function deletePKCEData(state: string): Promise<void> {
  // Delete from memory store
  pkceMemoryStore.delete(state);
  
  const db = await getDb();
  if (!db) {
    console.warn("[PKCE] Database not available for delete");
    return;
  }
  
  try {
    await db.delete(oauthPkceData).where(eq(oauthPkceData.state, state));
    console.log("[PKCE] Deleted PKCE data for state:", state.substring(0, 8) + "...");
  } catch (error) {
    console.error("[PKCE] Failed to delete from database:", error);
  }
}

// Memory fallback store for PKCE data
const pkceMemoryStore = new Map<string, { codeVerifier: string; callbackUrl: string }>();

// Target account to check follow status (idolfunch)
const TARGET_TWITTER_USERNAME = "idolfunch";

// フォロー状態のサーバー側キャッシュ（24時間 TTL、環境変数で設定可能）
// 最適化: 48時間→24時間に短縮してAPI呼び出しを削減しつつ、データの鮮度を保つ
const FOLLOW_STATUS_CACHE_TTL_HOURS = parseInt(
  process.env.FOLLOW_STATUS_CACHE_TTL_HOURS || "24",
  10
);
const FOLLOW_STATUS_CACHE_TTL_MS = FOLLOW_STATUS_CACHE_TTL_HOURS * 60 * 60 * 1000;
interface FollowStatusCacheEntry {
  isFollowing: boolean;
  targetUser: { id: string; name: string; username: string };
  lastCheckedAt: number;
}
const followStatusCache = new Map<string, FollowStatusCacheEntry>();

function getFollowStatusCacheKey(sourceUserId: string, targetUsername: string): string {
  return `${sourceUserId}:${targetUsername}`;
}

// Check if user follows a specific account
// 指数バックオフとレート制限対応を適用
// レート制限時はスキップして認証を継続
// サーバー側で24時間キャッシュし、同一ユーザーの重複API呼び出しを削減
export async function checkFollowStatus(
  accessToken: string,
  sourceUserId: string,
  targetUsername: string = TARGET_TWITTER_USERNAME
): Promise<{
  isFollowing: boolean;
  targetUser: {
    id: string;
    name: string;
    username: string;
  } | null;
  skipped?: boolean;
}> {
  const cacheKey = getFollowStatusCacheKey(sourceUserId, targetUsername);
  const cached = followStatusCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.lastCheckedAt < FOLLOW_STATUS_CACHE_TTL_MS) {
    console.log("[Twitter API] Follow status cache hit for", sourceUserId);
    return {
      isFollowing: cached.isFollowing,
      targetUser: cached.targetUser,
    };
  }

  try {
    // First, get the target user's ID by username
    const userLookupUrl = `https://api.twitter.com/2/users/by/username/${targetUsername}`;
    
    // レート制限時はタイムアウトを短くしてスキップ
    const { data: userData, rateLimitInfo: userRateLimitInfo } = await twitterApiFetch<{ data?: { id: string; name: string; username: string } }>(
      userLookupUrl,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      },
      { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 5000 } // リトライを減らして高速化
    );
    
    // レート制限に近づいている場合はスキップ（待機しない）
    if (userRateLimitInfo && userRateLimitInfo.remaining <= 0) {
      console.log("[Twitter API] Rate limit reached, skipping follow check");
      return { isFollowing: false, targetUser: null, skipped: true };
    }
    
    const targetUser = userData.data;
    
    if (!targetUser) {
      console.error("Target user not found:", targetUsername);
      return { isFollowing: false, targetUser: null };
    }
    
    // Check if source user follows target user
    // Using the followers lookup endpoint
    const followCheckUrl = `https://api.twitter.com/2/users/${sourceUserId}/following`;
    const params = new URLSearchParams({
      "user.fields": "id,name,username",
      "max_results": "1000",
    });
    
    const { data: followData, rateLimitInfo: followRateLimitInfo } = await twitterApiFetch<{ data?: Array<{ id: string; name: string; username: string }> }>(
      `${followCheckUrl}?${params}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      },
      { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 5000 } // リトライを減らして高速化
    );
    
    // レート制限情報をログ
    if (followRateLimitInfo) {
      console.log(
        `[Twitter API] Follow check rate limit: ${followRateLimitInfo.remaining}/${followRateLimitInfo.limit} remaining`
      );
    }
    
    const following = followData.data || [];
    
    // Check if target user is in the following list
    const isFollowing = following.some((user: { id: string }) => user.id === targetUser.id);
    
    const targetUserInfo = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username,
    };

    // 24時間キャッシュに保存
    followStatusCache.set(cacheKey, {
      isFollowing,
      targetUser: targetUserInfo,
      lastCheckedAt: now,
    });
    
    return {
      isFollowing,
      targetUser: targetUserInfo,
    };
  } catch (error) {
    // レート制限エラーの場合はスキップして認証を継続
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      console.log("[Twitter API] Rate limit error, skipping follow check");
      return { isFollowing: false, targetUser: null, skipped: true };
    }
    console.error("Follow status check error:", error);
    return { isFollowing: false, targetUser: null };
  }
}

// Get target account info
export function getTargetAccountInfo() {
  return {
    username: TARGET_TWITTER_USERNAME,
    displayName: "君斗りんく",
    profileUrl: `https://twitter.com/${TARGET_TWITTER_USERNAME}`,
  };
}


// ユーザー名からプロフィール情報を取得（Bearer Token認証）
export async function getUserProfileByUsername(username: string): Promise<{
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  description?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
} | null> {
  // ユーザー名をクリーンアップ（@を削除、URLからユーザー名を抽出）
  let cleanUsername = username.trim();
  
  // URL形式の場合（https://x.com/username または https://twitter.com/username）
  const urlMatch = cleanUsername.match(/(?:https?:\/\/)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  if (urlMatch) {
    cleanUsername = urlMatch[1];
  }
  
  // @を削除
  cleanUsername = cleanUsername.replace(/^@/, "");
  
  if (!cleanUsername) {
    return null;
  }
  
  try {
    // Bearer Token認証を使用（アプリ専用認証）
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.error("TWITTER_BEARER_TOKEN is not set");
      return null;
    }
    
    const url = `https://api.twitter.com/2/users/by/username/${cleanUsername}`;
    const params = "user.fields=profile_image_url,public_metrics,description";
    const fullUrl = `${url}?${params}`;
    
    // twitterApiFetchを使用してレート制限対応と使用量記録を自動化
    const { data, rateLimitInfo } = await twitterApiFetch<{ data?: {
      id: string;
      name: string;
      username: string;
      profile_image_url?: string;
      description?: string;
      public_metrics?: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
      };
    } }>(
      fullUrl,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${bearerToken}`,
        },
      }
    );
    
    if (!data.data) {
      console.error("Twitter user not found:", cleanUsername);
      return null;
    }
    
    // プロフィール画像を高解像度に変換
    const profileImageUrl = data.data.profile_image_url?.replace("_normal", "_400x400") || "";
    
    return {
      id: data.data.id,
      name: data.data.name,
      username: data.data.username,
      profile_image_url: profileImageUrl,
      description: data.data.description,
      public_metrics: data.data.public_metrics,
    };
  } catch (error) {
    console.error("Error fetching Twitter user profile:", error);
    return null;
  }
}

// =============================================================================
// トークンログ用サニタイザー（先頭4文字のみ表示 → デバッグと安全を両立）
// =============================================================================
export function sanitizeToken(token: string | null | undefined): string {
  if (!token) return "[empty]";
  return `${token.substring(0, 4)}...****`;
}

/**
 * Twitter OAuth 2.0 トークンをリボーク（無効化）する
 * access_token / refresh_token の両方に対応
 * 
 * @param token - リボーク対象のトークン
 * @param tokenTypeHint - "access_token" または "refresh_token"
 * @see https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */
export async function revokeToken(
  token: string,
  tokenTypeHint: "access_token" | "refresh_token" = "access_token"
): Promise<boolean> {
  if (!token) return false;

  const url = "https://api.twitter.com/2/oauth2/revoke";
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");

  try {
    const params = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: TWITTER_CLIENT_ID,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    if (response.ok) {
      console.log(`[Twitter OAuth 2.0] ${tokenTypeHint} revoked: ${sanitizeToken(token)}`);
      return true;
    }

    console.warn(`[Twitter OAuth 2.0] Token revoke returned ${response.status} for ${tokenTypeHint}`);
    return false;
  } catch (error) {
    console.warn("[Twitter OAuth 2.0] Token revoke failed:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

/** 後方互換: revokeAccessToken は revokeToken のエイリアス */
export const revokeAccessToken = (accessToken: string) => revokeToken(accessToken, "access_token");
