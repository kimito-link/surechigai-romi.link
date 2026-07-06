/**
 * 使用禁止（アーカイブ済み・2026-07-06）。
 * drizzle migration履歴とDB実態の不整合を修復済み（経緯: drizzle/migrations-archive/README.md、
 * docs/uxux-stability-audit-SPEC.md §1.2）。今後のスキーマ変更は必ず
 * `pnpm db:push`（drizzle-kit generate→migrate）で行うこと。本番への直接ALTERは禁止。
 *
 * 0006_live_presence カラムを IF NOT EXISTS で適用（drizzle migrate 履歴ずれ回避用）
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Client } = require("pg");

const stmts = [
  `ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "livePresenceEnabled" boolean DEFAULT false NOT NULL`,
  `ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "livePresenceLat" real`,
  `ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "livePresenceLng" real`,
  `ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "livePresenceMunicipality" text`,
  `ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "livePresenceUpdatedAt" timestamp`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  for (const sql of stmts) {
    await client.query(sql);
    console.log("OK:", sql.slice(0, 72));
  }
  await client.end();
  console.log("live presence migration applied");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
