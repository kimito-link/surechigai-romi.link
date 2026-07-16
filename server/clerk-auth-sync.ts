/**
 * Clerk ログイン後のユーザープロフィール同期の共通ロジック。
 *
 * 以前は api/auth/sync.ts (Vercel Functions・本番) と server/_core/index.ts
 * (Express・dev) にほぼ同じ内容が個別に書かれており、Vercel版にだけ
 * enrichTwitterProfile(都道府県クリエイター一覧のサムネ同期)の呼び出しが
 * 入っていてExpress版には無い、という乖離が発生していた
 * (refactor-instructions.md Debt #10)。両エントリーポイントはここを呼ぶだけにする。
 */
import { verifyToken, createClerkClient } from "@clerk/backend";
import { getDb } from "./db/connection.js";
import * as dbModule from "./db.js";
import { syncClerkTwitterProfileToDb } from "./clerk-profile-sync.js";
import { extractTwitterProfileFromClerkUser } from "../lib/clerk-twitter-profile.js";
import { getOrCreateUserShareSlug } from "../modules/encounter/db/queries.js";
import { enrichTwitterProfile } from "./creator-profile-enricher.js";

export type ClerkAuthSyncResult =
  | { ok: true; status: 200; body: { ok: true; user: unknown } }
  | { ok: false; status: 401 | 500; body: { error: string } };

/**
 * Authorization: Bearer <token> ヘッダーを検証し、Clerkユーザー情報を
 * DBへ同期する。呼び出し側(Express/Vercel)はHTTPレスポンスの組み立てのみ行う。
 */
export async function syncClerkAuthFromBearerToken(
  authHeader: string | undefined,
): Promise<ClerkAuthSyncResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, body: { error: "No token" } };
  }

  const token = authHeader.slice(7).trim();
  const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!clerkSecretKey) {
    return { ok: false, status: 500, body: { error: "Clerk not configured" } };
  }

  try {
    const payload = await verifyToken(token, { secretKey: clerkSecretKey });
    const clerkUserId = payload?.sub;
    if (!clerkUserId) {
      return {
        ok: false,
        status: 401,
        body: { error: "Invalid token: missing sub claim" },
      };
    }

    const openId = `clerk:${clerkUserId}`;
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const twitterProfile = extractTwitterProfileFromClerkUser(clerkUser);

    let user = await dbModule.getUserByOpenId(openId);
    if (!user) {
      await dbModule.upsertUser({
        openId,
        name: twitterProfile?.displayName || clerkUser.fullName || "Unknown",
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        loginMethod: "twitter",
        lastSignedIn: new Date(),
      });
      user = await dbModule.getUserByOpenId(openId);
    }

    const db = await getDb();
    if (db && user && twitterProfile) {
      await syncClerkTwitterProfileToDb(db, user.id, twitterProfile);
      await enrichTwitterProfile(db, twitterProfile.twitterUsername);
      await getOrCreateUserShareSlug(db, user.id);
      user = await dbModule.getUserByOpenId(openId);
    }

    return { ok: true, status: 200, body: { ok: true, user } };
  } catch (err) {
    console.error("[clerk-auth-sync] Error:", err);
    return { ok: false, status: 401, body: { error: "Invalid token" } };
  }
}
