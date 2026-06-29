/**
 * Clerk ログイン後のユーザープロフィール同期（Vercel Functions）。
 * X username / twitterUserCache / shareSlug を DB に反映する。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { getDb } from "../../server/db/connection.js";
import { syncClerkTwitterProfileToDb } from "../../server/clerk-profile-sync.js";
import { extractTwitterProfileFromClerkUser } from "../../lib/clerk-twitter-profile.js";
import { getOrCreateUserShareSlug } from "../../modules/encounter/db/queries.js";
import { enrichTwitterProfile } from "../../server/creator-profile-enricher.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token" });
      return;
    }

    const token = authHeader.slice(7).trim();
    const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (!clerkSecretKey) {
      res.status(500).json({ error: "Clerk not configured" });
      return;
    }

    const payload = await verifyToken(token, { secretKey: clerkSecretKey });
    const clerkUserId = payload?.sub;
    if (!clerkUserId) {
      res.status(401).json({ error: "Invalid token: missing sub claim" });
      return;
    }

    const openId = `clerk:${clerkUserId}`;
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    const dbModule = await import("../../server/db/index.js");
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

    res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error("[api/auth/sync] Error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}
