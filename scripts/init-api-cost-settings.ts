/**
 * APIコスト設定の初期化スクリプト
 * 実行: npx tsx scripts/init-api-cost-settings.ts
 * .env.local または .env の DATABASE_URL (MySQL/TiDB) を使用します。
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { apiCostSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function initApiCostSettings() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = mysql.createPool(process.env.DATABASE_URL);
  const db = drizzle(pool);

  console.log("Initializing API cost settings...");

  try {
    const existing = await db.select().from(apiCostSettings).limit(1);

    if (existing.length > 0) {
      console.log("Existing settings found:");
      console.log(`  Monthly Limit: $${existing[0].monthlyLimit}`);
      console.log(`  Alert Threshold: $${existing[0].alertThreshold}`);
      console.log(`  Alert Email: ${existing[0].alertEmail || "Not set"}`);
      console.log(`  Auto Stop: ${existing[0].autoStop === 1 ? "Enabled" : "Disabled"}`);

      await db
        .update(apiCostSettings)
        .set({
          monthlyLimit: "10.00",
          alertThreshold: "8.00",
          alertEmail: "info@best-trust.biz",
          autoStop: 1,
          updatedAt: new Date(),
        })
        .where(eq(apiCostSettings.id, existing[0].id));

      console.log("\n✅ Settings updated.");
    } else {
      await db.insert(apiCostSettings).values({
        monthlyLimit: "10.00",
        alertThreshold: "8.00",
        alertEmail: "info@best-trust.biz",
        autoStop: 1,
      });
      console.log("\n✅ Settings created.");
    }
  } catch (error: unknown) {
    console.error("✗ Failed to initialize settings:", error);
    process.exit(1);
  }

  console.log("\nDone!");
  process.exit(0);
}

initApiCostSettings();
