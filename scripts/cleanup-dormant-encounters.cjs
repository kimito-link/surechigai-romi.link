/**
 * 開発テスト用の休眠アカウントとのすれ違い記録を削除。
 * 位置記録が少ない（5件未満）ユーザーが関わる encounter を消す。
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { Client } = require("pg");

const MIN_LOCATIONS_FOR_MATCH = 5;

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const res = await c.query(
    `
    DELETE FROM encounters e
    WHERE EXISTS (
      SELECT 1
      FROM (
        SELECT e."userAId" AS uid
        UNION
        SELECT e."userBId" AS uid
      ) involved
      LEFT JOIN (
        SELECT "userId", count(*)::int AS cnt
        FROM locations
        WHERE "deletedAt" IS NULL
        GROUP BY "userId"
      ) lc ON lc."userId" = involved.uid
      WHERE coalesce(lc.cnt, 0) < $1
    )
    RETURNING id, "userAId", "userBId"
    `,
    [MIN_LOCATIONS_FOR_MATCH],
  );

  console.log(`Removed ${res.rowCount} test/dormant encounter(s)`);
  for (const row of res.rows) {
    console.log(" ", row.id, row.userAId, row.userBId);
  }
  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
