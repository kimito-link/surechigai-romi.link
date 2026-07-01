/**
 * Invoke event.create via tRPC caller (local smoke).
 * Usage: node --import tsx scripts/invoke-event-create.ts [userId]
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const userId = Number(process.argv[2] || 1);
  const { getDb } = await import("../server/db/connection.js");
  const { appRouter } = await import("../server/routers/index.js");
  const { users } = await import("../drizzle/schema/index.js");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("No DB");

  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) throw new Error(`User ${userId} not found`);

  const ctx = {
    req: { headers: {}, method: "POST", url: "/api/trpc", protocol: "https", originalUrl: "/" } as never,
    res: { headersSent: false, setHeader() {} } as never,
    user,
  };

  const caller = appRouter.createCaller(ctx);
  const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  console.log("Creating online event...");
  const online = await caller.event.create({
    title: `[smoke] online ${Date.now()}`,
    locationType: "online",
    onlineUrl: "https://example.com/live",
    startAt,
    visibility: "public",
  });
  console.log("  id:", online.id);

  console.log("Creating offline unlisted event...");
  const offline = await caller.event.create({
    title: `[smoke] offline ${Date.now()}`,
    locationType: "offline",
    prefecture: "長野県",
    venueName: "テスト会場",
    startAt,
    visibility: "unlisted",
    accessCode: "smoke-test",
  });
  console.log("  id:", offline.id);

  console.log("Canceling smoke events...");
  await caller.event.cancel({ eventId: online.id });
  await caller.event.cancel({ eventId: offline.id });
  console.log("ALL OK");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
