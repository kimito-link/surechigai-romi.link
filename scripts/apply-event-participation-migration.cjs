/**
 * 0007_event_participations を IF NOT EXISTS で適用（drizzle migrate 履歴ずれ回避用）
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
    path.join(__dirname, "../drizzle/migrations/0007_event_participations.sql"),
    "utf8",
  );
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("event participation migration applied");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
