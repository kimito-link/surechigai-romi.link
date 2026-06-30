/**
 * trailCount (dashboard.mySignal) と myTrail 件数の一致を確認する。
 * Usage: node --import tsx scripts/check-trail-count-consistency.ts [userId|username]
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const arg = process.argv[2];
  const { getDb } = await import("../server/db/connection.js");
  const { getTrailCount } = await import("../modules/encounter/db/dashboard-queries.js");
  const { getMyTrailLocations } = await import("../modules/encounter/db/queries.js");
  const { users } = await import("../drizzle/schema/users.js");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL 未設定または DB 接続不可");
    process.exit(1);
  }

  let userId: number | undefined;
  if (arg) {
    const asNum = Number(arg);
    if (Number.isFinite(asNum) && asNum > 0) {
      userId = asNum;
    } else {
      const rows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.name, arg))
        .limit(1);
      userId = rows[0]?.id;
      if (!userId) {
        console.error(`ユーザー "${arg}" が見つかりません`);
        process.exit(1);
      }
    }
  } else {
    const rows = await db.select({ id: users.id, name: users.name }).from(users).limit(5);
    console.log("引数未指定 — 先頭ユーザーで確認:", rows);
    userId = rows[0]?.id;
    if (!userId) {
      console.error("ユーザーが存在しません");
      process.exit(1);
    }
  }

  const [trailCount, locations] = await Promise.all([
    getTrailCount(db, userId),
    getMyTrailLocations(db, userId, 500),
  ]);

  const myTrailCount = locations.length;
  const match = trailCount === myTrailCount;

  console.log(JSON.stringify({ userId, trailCount, myTrailCount, match }, null, 2));

  if (!match) {
    console.warn(
      "不一致: lat IS NULL の旧レコード、または dashboard / zukan クエリ条件の差異を調査してください",
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
