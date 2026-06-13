/**
 * 繧ｻ繝・す繝ｧ繝ｳ邂｡逅・SDK
 * 
 * JWT 繝吶・繧ｹ縺ｮ繧ｻ繝・す繝ｧ繝ｳ繝医・繧ｯ繝ｳ逕滓・繝ｻ讀懆ｨｼ縺ｨ縲√Μ繧ｯ繧ｨ繧ｹ繝郁ｪ崎ｨｼ繧定｡後≧縲・ * 
 * 豕ｨ諢・ Manus OAuth Server 縺ｨ縺ｮ騾壻ｿ｡・・AuthService, exchangeCodeForToken,
 * getUserInfo, getUserInfoWithJwt・峨・迴ｾ蝨ｨ菴ｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・◆繧∝炎髯､貂医∩縲・ * 繝ｭ繧ｰ繧､繝ｳ縺ｯ Twitter OAuth 2.0 縺ｮ縺ｿ菴ｿ逕ｨ縺励√Θ繝ｼ繧ｶ繝ｼ諠・ｱ縺ｯ逶ｴ謗･ DB 縺ｫ菫晏ｭ倥＆繧後ｋ縲・ */
import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "../../shared/const.js";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { ForbiddenError } from "../../shared/_core/errors.js";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class SDKServer {
  constructor() {
    // Manus OAuth Server の初期化は HTTP リクエスト時に遅延
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    // 繝・せ繝医〒迺ｰ蠅・､画焚繧貞､画峩縺ｧ縺阪ｋ繧医≧縺ｫ縲・NV.cookieSecret縺ｧ縺ｯ縺ｪ縺術rocess.env.JWT_SECRET繧堤峩謗･蜿ら・
    const secret = process.env.JWT_SECRET ?? ENV.cookieSecret;
    
    if (!secret || secret.trim() === "") {
      throw new Error(
        "JWT_SECRET environment variable is not set or empty. " +
        "This is required for session token generation."
      );
    }
    
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a user openId
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {},
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options,
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {},
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? SESSION_MAX_AGE_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null,
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * 繝ｪ繧ｯ繧ｨ繧ｹ繝医°繧峨Θ繝ｼ繧ｶ繝ｼ繧定ｪ崎ｨｼ縺吶ｋ縲・   * Bearer 繝医・繧ｯ繝ｳ or 繧ｻ繝・す繝ｧ繝ｳ Cookie 縺ｮ JWT 繧呈､懆ｨｼ縺励．B 縺九ｉ繝ｦ繝ｼ繧ｶ繝ｼ繧貞叙蠕励☆繧九・   */
  async authenticateRequest(req: Request): Promise<User> {
    // Bearer token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token: string | undefined;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    // Clerk JWT verification (primary)
    if (token && process.env.CLERK_SECRET_KEY?.trim()) {
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const clerkUserId = payload?.sub;
        if (!clerkUserId) {
          throw ForbiddenError("Invalid token: missing sub claim");
        }
        const openId = `clerk:${clerkUserId}`;

        let user = await db.getUserByOpenId(openId);
        if (!user) {
          const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
          const clerkUser = await clerk.users.getUser(clerkUserId);
          const twitterAccount = clerkUser.externalAccounts?.find(
            (a: { provider: string }) => a.provider === "x" || a.provider === "oauth_x",
          );
          await db.upsertUser({
            openId,
            name:
              clerkUser.fullName ||
              (twitterAccount as { username?: string } | undefined)?.username ||
              "Unknown",
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            loginMethod: "twitter",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByOpenId(openId);
        }

        if (user) return user;
      } catch (e) {
        const err = e as { code?: string; message?: string };
        if (err?.code === "ECONNREFUSED" || err?.message?.includes("fetch")) {
          throw e;
        }
        // Clerk JWT でなければカスタム JWT にフォールバック
      }
    }

    // Cookie fallback
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;

    // アクティビティチェック（セッション無操作タイムアウト）
    if (!checkAndUpdateActivity(sessionUserId)) {
      throw ForbiddenError("Session expired due to inactivity");
    }

    const signedInAt = new Date();
    const user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      console.error("[Auth] User not found in DB:", sessionUserId);
      throw ForbiddenError("User not found");
    }

    // lastSignedIn 更新（BUG-007対策: 5分間隔で DB 更新をスロットリング）
    const lastUpdate = lastSignedInCache.get(user.openId);
    const THROTTLE_MS = 5 * 60 * 1000; // 5分
    if (!lastUpdate || (Date.now() - lastUpdate) > THROTTLE_MS) {
      lastSignedInCache.set(user.openId, Date.now());
      db.upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt,
      }).catch((err) => console.warn("[Auth] lastSignedIn update failed:", err));
    }

    return user;
  }
}

// =============================================================================
// 繧ｻ繝・す繝ｧ繝ｳ繧｢繧､繝峨Ν繧ｿ繧､繝繧｢繧ｦ繝茨ｼ医ぎ繧､繝画耳螂ｨ: 髱槭い繧ｯ繝・ぅ繝悶Θ繝ｼ繧ｶ繝ｼ縺ｮ閾ｪ蜍輔Ο繧ｰ繧｢繧ｦ繝茨ｼ・// JWT縺ｮ邨ｶ蟇ｾ繧ｿ繧､繝繧｢繧ｦ繝・72h)縺ｫ蜉縺医∵桃菴懊′縺ｪ縺・ｴ蜷医↓繧ｻ繝・す繝ｧ繝ｳ繧堤┌蜉ｹ蛹・// =============================================================================

const SESSION_IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4時間無操作でタイムアウト
const lastActivityMap = new Map<string, number>();
// BUG-007: lastSignedIn譖ｴ譁ｰ縺ｮ繧ｹ繝ｭ繝・ヨ繝ｪ繝ｳ繧ｰ逕ｨ繧ｭ繝｣繝・す繝･
const lastSignedInCache = new Map<string, number>();

// 繝｡繝｢繝ｪ繝ｪ繝ｼ繧ｯ髦ｲ豁｢: 蜿､縺・お繝ｳ繝医Μ繧貞ｮ壽悄逧・↓繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of lastActivityMap.entries()) {
    if (now - ts > SESSION_IDLE_TIMEOUT_MS * 2) {
      lastActivityMap.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1譎る俣縺斐→縺ｫ繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・

/**
 * 繧｢繧､繝峨Ν繧ｿ繧､繝繧｢繧ｦ繝医・繝√ぉ繝・け縺ｨ譖ｴ譁ｰ
 * @returns false = 繧ｿ繧､繝繧｢繧ｦ繝医＠縺ｦ縺・ｋ (繧ｻ繝・す繝ｧ繝ｳ辟｡蜉ｹ)
 */
export function checkAndUpdateActivity(openId: string): boolean {
  const now = Date.now();
  const lastActivity = lastActivityMap.get(openId);
  
  // 蛻晏屓繧｢繧ｯ繧ｻ繧ｹ縺ｯ蟶ｸ縺ｫOK
  if (lastActivity === undefined) {
    lastActivityMap.set(openId, now);
    return true;
  }
  
  // 繧｢繧､繝峨Ν繧ｿ繧､繝繧｢繧ｦ繝医メ繧ｧ繝・け
  if (now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    lastActivityMap.delete(openId);
    return false; // セッション切れ
  }
  
  // 譛邨ゅい繧ｯ繝・ぅ繝薙ユ繧｣繧呈峩譁ｰ
  lastActivityMap.set(openId, now);
  return true;
}

/** 繝ｭ繧ｰ繧｢繧ｦ繝域凾縺ｫ繧｢繧ｯ繝・ぅ繝薙ユ繧｣險倬鹸繧貞炎髯､ */
export function clearActivity(openId: string): void {
  lastActivityMap.delete(openId);
}

export const sdk = new SDKServer();



