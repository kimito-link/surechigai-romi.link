/**
 * Database Schema Integrity Check
 * 
 * DBスキーマの整合性をチェックし、コードとDBの不一致を検出する
 * 
 * 機能:
 * - 期待するカラムが存在するかチェック
 * - マイグレーション適用状態の確認
 * - 不一致時の通知
 */

import { getDb, sql } from "./db";

// 期待するスキーマ定義（重要なテーブルとカラムのみ）
// 新しいマイグレーションを追加したら、ここも更新する
// カラム名はdrizzleスキーマの定義と一致させること
const EXPECTED_SCHEMA = {
  version: "0027", // 最新のマイグレーション番号（api_usage 含む）
  tables: {
    // participationsテーブル: 参加登録
    participations: {
      requiredColumns: [
        "id",
        "challengeId",
        "userId",
        "twitterId",
        "displayName",
        "username",
        "profileImage",
        "followersCount",
        "message",
        "companionCount",
        "prefecture",
        "gender",
        "contribution",
        "isAnonymous",
        "createdAt",
        "updatedAt",
        // v6.40で追加されたソフトデリート用カラム
        "deletedAt",
        "deletedBy",
      ],
    },
    // challengesテーブル: チャレンジ（イベント）
    // 実際のスキーマはgoalValue/currentValue/hostUserIdを使用
    challenges: {
      requiredColumns: [
        "id",
        "title",
        "slug",
        "description",
        "goalValue",      // targetCountではなくgoalValue
        "currentValue",   // currentCountではなくcurrentValue
        "eventDate",
        "venue",
        "prefecture",
        "hostUserId",     // organizerIdではなくhostUserId
        "status",
        "createdAt",
        "updatedAt",
      ],
    },
    // usersテーブル: ユーザー
    // 実際のスキーマはopenId/nameを使用（twitterId/username/displayName/profileImageはない）
    users: {
      requiredColumns: [
        "id",
        "openId",         // 認証用ID
        "name",           // 表示名
        "email",
        "role",
        "createdAt",
        "updatedAt",
      ],
    },
    // api_usage: X API 使用量記録（0027）
    api_usage: {
      requiredColumns: [
        "id",
        "endpoint",
        "method",
        "success",
        "cost",
        "rateLimitInfo",
        "month",
        "createdAt",
      ],
    },
    // api_cost_settings: コスト上限設定（0027）
    api_cost_settings: {
      requiredColumns: [
        "id",
        "monthlyLimit",
        "alertThreshold",
        "alertEmail",
        "autoStop",
        "createdAt",
        "updatedAt",
      ],
    },
  },
};

export interface SchemaCheckResult {
  status: "ok" | "mismatch" | "error";
  expectedVersion: string;
  actualVersion?: string;
  missingColumns: Array<{
    table: string;
    column: string;
  }>;
  errors: string[];
  checkedAt: string;
}

/**
 * DBスキーマの整合性をチェック
 */
export async function checkSchemaIntegrity(): Promise<SchemaCheckResult> {
  const result: SchemaCheckResult = {
    status: "ok",
    expectedVersion: EXPECTED_SCHEMA.version,
    missingColumns: [],
    errors: [],
    checkedAt: new Date().toISOString(),
  };

  try {
    const db = await getDb();
    if (!db) {
      result.status = "error";
      result.errors.push("Database connection not available");
      return result;
    }

    // 各テーブルのカラムをチェック
    for (const [tableName, tableSpec] of Object.entries(EXPECTED_SCHEMA.tables)) {
      try {
        // テーブルのカラム情報を取得（PostgreSQL）
        const columnsResult = await db.execute(
          sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${tableName}`
        );
        const raw = columnsResult as unknown as { rows?: Array<{ column_name: string }> } | Array<unknown>;
        const rows = Array.isArray(raw) ? raw[0] : raw?.rows ?? raw;
        const existingColumns = new Set(
          (rows as unknown as Array<{ column_name: string }>).map((c) => (c.column_name || (c as unknown as { COLUMN_NAME: string }).COLUMN_NAME || "").toLowerCase())
        );

        // 期待するカラムが存在するかチェック（PostgreSQLは小文字で返すことがある）
        for (const requiredColumn of tableSpec.requiredColumns) {
          if (!existingColumns.has(requiredColumn.toLowerCase())) {
            result.missingColumns.push({
              table: tableName,
              column: requiredColumn,
            });
          }
        }
      } catch (tableError) {
        result.errors.push(
          `Failed to check table ${tableName}: ${tableError instanceof Error ? tableError.message : String(tableError)}`
        );
      }
    }

    // マイグレーション履歴テーブルから最新バージョンを取得（PostgreSQL）
    try {
      const migrationsResult = await db.execute(
        sql`SELECT hash FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1`
      );
      const migRaw = migrationsResult as unknown as { rows?: Array<{ hash: string }> } | Array<unknown>;
      const migRows = Array.isArray(migRaw) ? migRaw[0] : migRaw?.rows ?? migRaw;
      const migList = Array.isArray(migRows) ? migRows : [migRows];
      if (migList.length > 0) {
        result.actualVersion = (migList[0] as { hash: string }).hash?.slice(0, 8) || "unknown";
      }
    } catch {
      // マイグレーション履歴テーブルが存在しない場合は無視
      result.actualVersion = "unknown";
    }

    // 結果の判定
    if (result.missingColumns.length > 0) {
      result.status = "mismatch";
    } else if (result.errors.length > 0) {
      result.status = "error";
    }

    return result;
  } catch (error) {
    result.status = "error";
    result.errors.push(
      `Schema check failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return result;
  }
}

/**
 * スキーマ不一致時にWebhook通知を送信
 */
export async function notifySchemaIssue(result: SchemaCheckResult): Promise<void> {
  const webhookUrl = process.env.DEPLOY_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[schema-check] Webhook URL not configured, skipping notification");
    return;
  }

  const isDiscord = webhookUrl.includes("discord.com");
  const appName = process.env.APP_NAME || "Birthday Celebration";
  const environment = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || "unknown";

  const missingColumnsText = result.missingColumns
    .map((mc) => `${mc.table}.${mc.column}`)
    .join(", ");

  const payload = isDiscord
    ? {
        embeds: [
          {
            title: "⚠️ Schema Mismatch Detected",
            description: `Database schema does not match expected schema.`,
            color: 0xf59e0b, // warning yellow
            timestamp: new Date().toISOString(),
            fields: [
              { name: "App", value: appName, inline: true },
              { name: "Environment", value: environment, inline: true },
              { name: "Expected Version", value: result.expectedVersion, inline: true },
              { name: "Missing Columns", value: missingColumnsText || "None" },
              ...(result.errors.length > 0
                ? [{ name: "Errors", value: result.errors.join("\n") }]
                : []),
            ],
          },
        ],
      }
    : {
        attachments: [
          {
            color: "warning",
            title: "⚠️ Schema Mismatch Detected",
            text: `Database schema does not match expected schema.`,
            ts: Math.floor(Date.now() / 1000),
            fields: [
              { title: "App", value: appName, short: true },
              { title: "Environment", value: environment, short: true },
              { title: "Expected Version", value: result.expectedVersion, short: true },
              { title: "Missing Columns", value: missingColumnsText || "None" },
              ...(result.errors.length > 0
                ? [{ title: "Errors", value: result.errors.join("\n") }]
                : []),
            ],
          },
        ],
      };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[schema-check] Failed to send notification: ${response.status}`);
    } else {
      console.log("[schema-check] Schema issue notification sent");
    }
  } catch (error) {
    console.error("[schema-check] Failed to send notification:", error);
  }
}
