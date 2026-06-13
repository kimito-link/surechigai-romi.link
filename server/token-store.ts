/**
 * サーバーサイド Twitter トークンストア (BFF Pattern)
 * 
 * セキュリティ要件:
 * - トークンはAES-256-GCMで暗号化してDBに保存
 * - クライアントには一切トークンを渡さない
 * - セッションCookie（HttpOnly）のopenIdでトークンを特定
 * - リフレッシュトークンローテーション対応
 */

import crypto from "crypto";
import { getDb } from "./db";
import { userTwitterTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// =============================================================================
// AES-256-GCM 暗号化/復号
// =============================================================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM推奨
const AUTH_TAG_LENGTH = 16;

/**
 * 暗号化キーを環境変数から取得（32バイト = 256ビット）
 * TOKEN_ENCRYPTION_KEY が未設定の場合は JWT_SECRET から派生
 */
function getEncryptionKey(): Buffer {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY or JWT_SECRET must be set for token encryption");
  }
  // SHA-256で32バイトに正規化
  return crypto.createHash("sha256").update(rawKey).digest();
}

/** 平文 → 暗号化文字列 (hex: IV + AuthTag + Ciphertext) */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // IV(12) + AuthTag(16) + Ciphertext をhex結合
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

/** 暗号化文字列 → 平文 */
export function decryptToken(encryptedHex: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(encryptedHex, "hex");
  
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return decipher.update(ciphertext) + decipher.final("utf8");
}

// =============================================================================
// メモリキャッシュ（DB接続不可時のフォールバック + 高速アクセス）
// =============================================================================

interface TokenCacheEntry {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string | null;
  createdAt: Date; // リフレッシュトークン最大寿命チェック用
}

const tokenCache = new Map<string, TokenCacheEntry>();

// リフレッシュトークンの最大寿命（拡張版要件定義書: 90日で再ログイン要求）
const REFRESH_TOKEN_MAX_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000; // 90日

// =============================================================================
// トークンCRUD操作
// =============================================================================

/**
 * トークンを保存（暗号化してDB + メモリキャッシュ）
 */
export async function storeTokens(
  openId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scope?: string;
  }
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
  
  // メモリキャッシュに即保存（既存エントリのcreatedAtを引き継ぎ）
  const existingEntry = tokenCache.get(openId);
  tokenCache.set(openId, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken || null,
    expiresAt,
    scope: tokens.scope || null,
    createdAt: existingEntry?.createdAt || new Date(), // 初回のみ記録
  });

  // DBに暗号化して保存（バックグラウンド）
  try {
    const db = await getDb();
    if (!db) return;

    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

    await db.insert(userTwitterTokens).values({
      openId,
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      tokenExpiresAt: expiresAt,
      scope: tokens.scope || null,
    }).onDuplicateKeyUpdate({
      set: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope || null,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    // テーブル不存在エラーを検出し、メモリキャッシュのみで続行
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE") || msg.includes("1146")) {
      console.warn("[TokenStore] Table not found, using memory-only mode. Run migration to create user_twitter_tokens table.");
    } else {
      console.error("[TokenStore] DB save failed:", msg);
    }
    // いずれの場合もメモリキャッシュがあるので続行
  }
}

/**
 * トークンを取得（メモリキャッシュ → DB復号）
 */
export async function getTokens(openId: string): Promise<TokenCacheEntry | null> {
  // メモリキャッシュを先にチェック
  const cached = tokenCache.get(openId);
  if (cached) return cached;

  // DBから取得して復号
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(userTwitterTokens)
      .where(eq(userTwitterTokens.openId, openId))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    const entry: TokenCacheEntry = {
      accessToken: decryptToken(row.encryptedAccessToken),
      refreshToken: row.encryptedRefreshToken ? decryptToken(row.encryptedRefreshToken) : null,
      expiresAt: new Date(row.tokenExpiresAt),
      scope: row.scope,
      createdAt: new Date(row.createdAt), // DB の createdAt をそのまま使用
    };

    // メモリキャッシュに載せる
    tokenCache.set(openId, entry);
    return entry;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE") || msg.includes("1146")) {
      // テーブル未作成：メモリキャッシュのみで動作
      return null;
    }
    console.error("[TokenStore] DB read failed:", msg);
    return null;
  }
}

/**
 * 有効なアクセストークンを取得（期限切れなら自動リフレッシュ）
 */
export async function getValidAccessToken(openId: string): Promise<string | null> {
  const entry = await getTokens(openId);
  if (!entry) return null;

  // リフレッシュトークン最大寿命チェック（拡張版要件定義書: 90日で強制再ログイン）
  const tokenAge = Date.now() - entry.createdAt.getTime();
  if (tokenAge > REFRESH_TOKEN_MAX_LIFETIME_MS) {
    console.log(`[TokenStore] Token max lifetime exceeded for ${openId.substring(0, 8)}... (${Math.floor(tokenAge / 86400000)}d), requiring re-login`);
    await deleteTokens(openId);
    return null; // 再ログインが必要
  }

  // 有効期限の5分前からリフレッシュ（バッファ）
  const bufferMs = 5 * 60 * 1000;
  if (entry.expiresAt.getTime() - bufferMs > Date.now()) {
    return entry.accessToken;
  }

  // リフレッシュトークンがなければ現在のトークンを返す
  if (!entry.refreshToken) return entry.accessToken;

  // サーバーサイドでリフレッシュ（トークンローテーション）
  try {
    const { refreshAccessToken, sanitizeToken } = await import("./twitter-oauth2");
    const newTokens = await refreshAccessToken(entry.refreshToken);
    
    // 新しいトークンを保存（ローテーション: 新しいrefresh_tokenで上書き → 古いものは無効化）
    await storeTokens(openId, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresIn: newTokens.expires_in,
      scope: newTokens.scope,
    });

    console.log(`[TokenStore] Auto-refresh success for ${openId.substring(0, 8)}... new token: ${sanitizeToken(newTokens.access_token)}`);
    return newTokens.access_token;
  } catch (error) {
    console.error("[TokenStore] Auto-refresh failed:", error instanceof Error ? error.message : "unknown");
    // リフレッシュ失敗時は現在のトークンを返す（期限切れの可能性あり）
    return entry.accessToken;
  }
}

/**
 * トークンを削除（ログアウト時）
 */
export async function deleteTokens(openId: string): Promise<void> {
  tokenCache.delete(openId);

  try {
    const db = await getDb();
    if (!db) return;
    await db.delete(userTwitterTokens).where(eq(userTwitterTokens.openId, openId));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE") || msg.includes("1146")) {
      // テーブル未作成時は無視
      return;
    }
    console.error("[TokenStore] DB delete failed:", msg);
  }
}
