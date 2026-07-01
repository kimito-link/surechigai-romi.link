/**
 * Check prod DB schema columns for checkIn-related tables.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const TABLES = ["locations", "user_settings", "encounters", "visited_areas"];

async function main() {
  const { Client } = require("pg");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();

  for (const table of TABLES) {
    const { rows } = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table],
    );
    console.log(`\n=== ${table} (${rows.length} cols) ===`);
    for (const r of rows) {
      console.log(`  ${r.column_name}: ${r.data_type} nullable=${r.is_nullable}`);
    }
  }

  const { rows: users } = await client.query(
    `SELECT id, name, "openId" FROM users WHERE name ILIKE '%streamerfunch%' OR name ILIKE '%君斗%' LIMIT 5`,
  );
  console.log("\n=== matching users ===");
  console.log(users);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
