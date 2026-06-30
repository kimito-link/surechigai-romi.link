/**
 * 0005: locations.visibility 列を本番 DB に追加（冪等）。
 * 使い方: node scripts/apply-0005-location-visibility.cjs
 */
require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL が .env.local にありません");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS visibility varchar(16) DEFAULT 'public' NOT NULL
    `);

    const { rows: col } = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'visibility'
    `);

    const { rows: counts } = await client.query(`
      SELECT visibility, COUNT(*)::int AS n
      FROM locations
      WHERE "deletedAt" IS NULL
      GROUP BY visibility
      ORDER BY visibility
    `);

    console.log("OK: locations.visibility 列を確認しました");
    console.log(JSON.stringify({ column: col, counts }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
