/**
 * ログインセキュリティモジュール
 * 
 * - ログイン監査ログ（IP, User-Agent, 成功/失敗）
 * - ログイン失敗回数制限（5回失敗→10分ロック）
 * - ログイン直後API連打防止（30秒クールダウン）
 * - IP/User-Agent変化検知
 */

import crypto from "crypto";
import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";
import type { Request } from "express";

// =============================================================================
// ログイン監査ログ
// =============================================================================

interface LoginAuditEntry {
  openId: string;
  twitterId?: string;
  twitterUsername?: string;
  success: boolean;
  ip: string;
  userAgent: string;
  failureReason?: string;
}

/**
 * リクエストからIPアドレスを安全に取得
 */
export function getClientIp(req: Request): string {
  // X-Forwarded-For（プロキシ経由）
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const firstIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return firstIp?.trim() || "unknown";
  }
  // X-Real-IP（nginx等）
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * リクエストからUser-Agentを取得
 */
export function getClientUserAgent(req: Request): string {
  return (req.headers["user-agent"] || "unknown").substring(0, 500);
}

/**
 * ログイン監査ログをDBに書き込む
 */
export async function writeLoginAuditLog(entry: LoginAuditEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(auditLogs).values({
      requestId: crypto.randomUUID(),
      action: "LOGIN",
      entityType: "user",
      actorName: entry.twitterUsername || entry.openId,
      reason: entry.success
        ? "Login successful"
        : `Login failed: ${entry.failureReason || "unknown"}`,
      ipAddress: entry.ip.substring(0, 45),
      userAgent: entry.userAgent.substring(0, 500),
      afterData: {
        openId: entry.openId,
        twitterId: entry.twitterId,
        success: entry.success,
      },
    });
  } catch (error) {
    // 監査ログ失敗はログインをブロックしない
    console.error("[LoginSecurity] Audit log write failed:", error instanceof Error ? error.message : "unknown");
  }
}

// =============================================================================
// ログイン失敗回数制限（メモリベース、5回失敗→10分ロック）
// =============================================================================

interface FailedLoginEntry {
  count: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10分
const FAILED_WINDOW_MS = 15 * 60 * 1000; // 15分のウィンドウ

// IPアドレスベースのログイン失敗カウンター
const failedLoginStore = new Map<string, FailedLoginEntry>();

// 定期クリーンアップ（1時間ごと）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failedLoginStore.entries()) {
    if (now - entry.firstFailedAt > FAILED_WINDOW_MS * 2) {
      failedLoginStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * ログインがロックされているかチェック
 */
export function isLoginLocked(ip: string): { locked: boolean; remainingSeconds: number } {
  const entry = failedLoginStore.get(ip);
  if (!entry || !entry.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  if (now >= entry.lockedUntil) {
    // ロック期限切れ → リセット
    failedLoginStore.delete(ip);
    return { locked: false, remainingSeconds: 0 };
  }

  return {
    locked: true,
    remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
  };
}

/**
 * ログイン失敗を記録
 */
export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = failedLoginStore.get(ip);

  if (!entry || now - entry.firstFailedAt > FAILED_WINDOW_MS) {
    // 新しいウィンドウ開始
    failedLoginStore.set(ip, {
      count: 1,
      firstFailedAt: now,
      lockedUntil: null,
    });
    return;
  }

  entry.count++;

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
    console.warn(`[LoginSecurity] IP ${ip.substring(0, 10)}... locked for ${LOCK_DURATION_MS / 1000}s after ${entry.count} failures`);
  }
}

/**
 * ログイン成功時にカウンターをリセット
 */
export function resetLoginFailures(ip: string): void {
  failedLoginStore.delete(ip);
}

// =============================================================================
// ログイン直後API連打防止（30秒クールダウン）
// =============================================================================

// openIdベースのクールダウンタイマー
const loginCooldownStore = new Map<string, number>();

/**
 * ログイン成功時にクールダウンを設定
 */
export function setLoginCooldown(openId: string): void {
  loginCooldownStore.set(openId, Date.now() + 30 * 1000); // 30秒
}

/**
 * クールダウン中かどうかチェック（Twitter API呼び出し前に使用）
 */
export function isInLoginCooldown(openId: string): boolean {
  const until = loginCooldownStore.get(openId);
  if (!until) return false;
  
  if (Date.now() >= until) {
    loginCooldownStore.delete(openId);
    return false;
  }
  return true;
}

// 定期クリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [key, until] of loginCooldownStore.entries()) {
    if (now >= until) {
      loginCooldownStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
