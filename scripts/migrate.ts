/**
 * Database Migration Script
 * 
 * デプロイ時に自動実行されるマイグレーションスクリプト
 * 
 * 機能:
 * - drizzle-kit migrate を実行
 * - 失敗時は exit(1) でデプロイをブロック
 * - Slack/Discord Webhook で通知（オプション）
 * 
 * 使用方法:
 * - pnpm db:migrate
 * - Railway Build Command: pnpm db:migrate && pnpm build
 */

import { execSync } from "child_process";

// 環境変数
const WEBHOOK_URL = process.env.DEPLOY_WEBHOOK_URL;
const APP_NAME = process.env.APP_NAME || "Birthday Celebration";
const RAILWAY_ENVIRONMENT = process.env.RAILWAY_ENVIRONMENT || "unknown";

interface NotificationPayload {
  content?: string; // Discord
  text?: string;    // Slack
  embeds?: Array<{
    title: string;
    description: string;
    color: number;
    timestamp: string;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  }>;
  attachments?: Array<{
    color: string;
    title: string;
    text: string;
    ts: number;
    fields?: Array<{
      title: string;
      value: string;
      short?: boolean;
    }>;
  }>;
}

/**
 * Webhook通知を送信
 */
async function sendNotification(
  type: "success" | "error",
  message: string,
  details?: string
): Promise<void> {
  if (!WEBHOOK_URL) {
    console.log("[migrate] Webhook URL not configured, skipping notification");
    return;
  }

  const isDiscord = WEBHOOK_URL.includes("discord.com");
  const timestamp = new Date().toISOString();
  const color = type === "success" ? 0x22c55e : 0xef4444; // green / red

  let payload: NotificationPayload;

  if (isDiscord) {
    // Discord Webhook format
    payload = {
      embeds: [{
        title: type === "success"
          ? "✅ Migration Successful"
          : "❌ Migration Failed",
        description: message,
        color,
        timestamp,
        fields: [
          { name: "App", value: APP_NAME, inline: true },
          { name: "Environment", value: RAILWAY_ENVIRONMENT, inline: true },
          ...(details ? [{ name: "Details", value: `\`\`\`\n${details.slice(0, 1000)}\n\`\`\`` }] : []),
        ],
      }],
    };
  } else {
    // Slack Webhook format
    payload = {
      attachments: [{
        color: type === "success" ? "good" : "danger",
        title: type === "success"
          ? "✅ Migration Successful"
          : "❌ Migration Failed",
        text: message,
        ts: Math.floor(Date.now() / 1000),
        fields: [
          { title: "App", value: APP_NAME, short: true },
          { title: "Environment", value: RAILWAY_ENVIRONMENT, short: true },
          ...(details ? [{ title: "Details", value: details.slice(0, 1000) }] : []),
        ],
      }],
    };
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[migrate] Failed to send notification: ${response.status}`);
    } else {
      console.log("[migrate] Notification sent successfully");
    }
  } catch (error) {
    console.error("[migrate] Failed to send notification:", error);
  }
}

/**
 * マイグレーションを実行
 */
async function runMigration(): Promise<void> {
  console.log("=".repeat(60));
  console.log("[migrate] Starting database migration...");
  console.log(`[migrate] App: ${APP_NAME}`);
  console.log(`[migrate] Environment: ${RAILWAY_ENVIRONMENT}`);
  console.log("=".repeat(60));

  // DATABASE_URL チェック
  if (!process.env.DATABASE_URL) {
    const errorMsg = "DATABASE_URL is not set. Migration cannot proceed.";
    console.error(`[migrate] ERROR: ${errorMsg}`);
    await sendNotification("error", errorMsg);
    process.exit(1);
  }

  try {
    // PostgreSQL: 既存の .sql は MySQL 用のため migrate は使わず、push でスキーマを同期する
    console.log("\n[migrate] Syncing schema to database (drizzle-kit push)...");
    execSync("npx drizzle-kit push", {
      stdio: "inherit",
      env: process.env,
    });

    console.log("\n" + "=".repeat(60));
    console.log("[migrate] ✅ Schema sync completed successfully!");
    console.log("=".repeat(60));

    await sendNotification(
      "success",
      "Database migration completed successfully. Application is ready to start."
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("\n" + "=".repeat(60));
    console.error("[migrate] ❌ Migration FAILED!");
    console.error("[migrate] Error:", errorMessage);
    console.error("=".repeat(60));

    await sendNotification(
      "error",
      "Database migration failed. Deployment has been blocked.",
      errorMessage
    );

    // 失敗時は exit(1) でデプロイをブロック
    process.exit(1);
  }
}

// 実行
runMigration().catch((error) => {
  console.error("[migrate] Unexpected error:", error);
  process.exit(1);
});
