/**
 * 使用禁止（アーカイブ済み・2026-07-06）。
 * drizzle migration履歴とDB実態の不整合を修復済み（経緯: drizzle/migrations-archive/README.md、
 * docs/uxux-stability-audit-SPEC.md §1.2）。今後のスキーマ変更は必ず
 * `pnpm db:push`（drizzle-kit generate→migrate）で行うこと。本番への直接ALTERは禁止。
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = fs.readFileSync(
    path.join(__dirname, "../drizzle/migrations/0008_event_participation_reminder.sql"),
    "utf8",
  );
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("event participation reminder migration applied");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
