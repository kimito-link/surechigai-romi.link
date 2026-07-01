/**
 * Invoke encounter.checkIn via tRPC caller (full server path, no HTTP auth).
 * Usage: node --import tsx scripts/invoke-checkin.ts [userId] [lat] [lng]
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { appRouter } from "../server/routers/index.js";
import type { User } from "../drizzle/schema/index.js";
import { getDb } from "../server/db/connection.js";

async function main() {
  const userId = Number(process.argv[2] || 1);
  const lat = Number(process.argv[3] || 36.0594389);
  const lng = Number(process.argv[4] || 138.0487431);

  const db = await getDb();
  if (!db) throw new Error("No DB");

  const { users } = await import("../drizzle/schema/index.js");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) throw new Error(`User ${userId} not found`);

  const fakeReq = {
    headers: {},
    method: "POST",
    url: "/api/trpc/encounter.checkIn",
    protocol: "https",
    originalUrl: "/api/trpc/encounter.checkIn",
  };
  const fakeRes = {
    headersSent: false,
    setHeader() {},
  };

  const ctx = {
    req: fakeReq as never,
    res: fakeRes as never,
    user: user as User,
  };

  const caller = appRouter.createCaller(ctx);
  console.log("Calling encounter.checkIn for user", userId, user.name, "at", lat, lng);
  const result = await caller.encounter.checkIn({ lat, lng, accuracy: 50 });
  console.log("SUCCESS:", result);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
