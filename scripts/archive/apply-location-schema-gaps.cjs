/**
 * 使用禁止（アーカイブ済み・2026-07-06）。
 * drizzle migration履歴とDB実態の不整合を修復済み（経緯: drizzle/migrations-archive/README.md、
 * docs/uxux-stability-audit-SPEC.md §1.2）。今後のスキーマ変更は必ず
 * `pnpm db:push`（drizzle-kit generate→migrate）で行うこと。本番への直接ALTERは禁止。
 *
 * locations.deletedAt / locations.visibility / user_settings.trailVisibility を冪等適用。
 * drizzle migrate 履歴ずれで 0004/0005 が未適用の本番 DB 向け。
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp
    `);
    await client.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS visibility varchar(16) DEFAULT 'public' NOT NULL
    `);
    await client.query(`
      ALTER TABLE user_settings
      ADD COLUMN IF NOT EXISTS "trailVisibility" varchar(16) DEFAULT 'public' NOT NULL
    `);

    const { rows } = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'locations'
        AND column_name IN ('deletedAt', 'visibility')
      ORDER BY column_name
    `);

    console.log("OK: location schema gaps applied");
    console.log(JSON.stringify({ locationsColumns: rows }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
