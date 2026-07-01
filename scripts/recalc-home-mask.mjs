/**
 * 全ユーザーの homeMaskCell を夜間帯チェックイン基準で再計算する（1回限りの修復用）。
 * 昼間の旅行先が自宅と誤判定されていたケースを解消する。
 */
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const HOME_MASK_MIN_NIGHT_VISITS = 3;

async function nightHomeCell(sql, userId) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await sql`
    SELECT "h3R8", count(*)::int AS cnt
    FROM locations
    WHERE "userId" = ${userId}
      AND "deletedAt" IS NULL
      AND "recordedAt" >= ${since}
      AND (
        extract(hour from "recordedAt" at time zone 'Asia/Tokyo') >= 23
        OR extract(hour from "recordedAt" at time zone 'Asia/Tokyo') <= 5
      )
    GROUP BY "h3R8"
    ORDER BY count(*) DESC
    LIMIT 1
  `;
  if (rows.length === 0 || rows[0].cnt < HOME_MASK_MIN_NIGHT_VISITS) return null;
  return rows[0].h3R8;
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

try {
  const users = await sql`SELECT id FROM users ORDER BY id`;
  for (const { id } of users) {
    const cell = await nightHomeCell(sql, id);
    await sql`
      UPDATE user_settings
      SET "homeMaskCell" = ${cell}
      WHERE "userId" = ${id}
    `;
    console.log(`user ${id}: homeMaskCell => ${cell ?? "null"}`);
  }
} finally {
  await sql.end();
}
