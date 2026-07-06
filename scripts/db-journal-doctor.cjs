/**
 * drizzle/migrations/meta/_journal.json と本番DBの実態を突き合わせるチェックスクリプト。
 *
 * 経緯: 2026-07-06、journalには0004までしか記録が無いのに、本番DBの
 * drizzle.__drizzle_migrations には0002までしか適用済みマークが無い、という
 * 二重の不整合が見つかった（docs/uxux-stability-audit-SPEC.md §1.2、
 * drizzle/migrations-archive/README.md）。同じ穴を二度と掘らないよう、
 * `pnpm db:push` の前に必ずこのチェックを通す。
 *
 * チェック内容:
 *   1. drizzle/migrations/*.sql の本数と _journal.json のエントリ数が一致するか
 *   2. 各エントリの tag に対応する .sql ファイルが実在するか
 *   3. drizzle.__drizzle_migrations の件数が _journal.json のエントリ数と一致するか
 *
 * 不整合が見つかった場合は非0で終了する（run-drizzle.cjs の push 前フックから呼ばれる）。
 */
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(projectRoot, "drizzle", "migrations");
const journalPath = path.join(migrationsDir, "meta", "_journal.json");

const envPaths = [
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, ".env"),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
  }
}

function readDatabaseUrlFromFile(filePath) {
  let raw = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      let value = trimmed.slice("DATABASE_URL=".length).trim();
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1).replace(/\\"/g, '"');
      }
      return value;
    }
  }
  return null;
}

if (!process.env.DATABASE_URL) {
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const value = readDatabaseUrlFromFile(envPath);
    if (value) {
      process.env.DATABASE_URL = value;
      break;
    }
  }
}

async function main() {
  const errors = [];

  if (!fs.existsSync(journalPath)) {
    console.error(`[db-journal-doctor] journal not found: ${journalPath}`);
    process.exit(1);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // 1. ファイル数とjournalエントリ数の一致
  if (sqlFiles.length !== journal.entries.length) {
    errors.push(
      `SQLファイル数(${sqlFiles.length})とjournalエントリ数(${journal.entries.length})が不一致`,
    );
  }

  // 2. 各エントリのtagに対応するファイルが実在するか
  for (const entry of journal.entries) {
    const expected = `${entry.tag}.sql`;
    if (!sqlFiles.includes(expected)) {
      errors.push(`journalのtag "${entry.tag}" に対応するファイルが無い: ${expected}`);
    }
  }

  // 3. 本番DBの__drizzle_migrations件数とjournalエントリ数の一致
  if (!process.env.DATABASE_URL) {
    console.warn("[db-journal-doctor] DATABASE_URL未設定のためDB側チェックはスキップ");
  } else {
    const postgres = require("postgres");
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    try {
      const schemaRows = await sql`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drizzle'
      `;
      if (schemaRows.length === 0) {
        errors.push("drizzle スキーマが本番DBに存在しない（migrateが一度も走っていない可能性）");
      } else {
        const tableRows = await sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
        `;
        if (tableRows.length === 0) {
          errors.push("drizzle.__drizzle_migrations テーブルが存在しない");
        } else {
          const migRows = await sql`SELECT COUNT(*) AS c FROM drizzle.__drizzle_migrations`;
          const dbCount = Number(migRows[0].c);
          if (dbCount !== journal.entries.length) {
            errors.push(
              `本番DBの適用済みマイグレーション数(${dbCount})とjournalエントリ数(${journal.entries.length})が不一致`,
            );
          }
        }
      }
    } finally {
      await sql.end();
    }
  }

  if (errors.length > 0) {
    console.error("[db-journal-doctor] 不整合が見つかりました:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error(
      "\npnpm db:push を実行する前に、この不整合を解消してください。" +
        "手順は docs/uxux-stability-audit-SPEC.md §1.2 を参照。",
    );
    process.exit(1);
  }

  console.log("[db-journal-doctor] OK: journal・SQLファイル・本番DBの整合性は問題ありません");
}

main().catch((err) => {
  console.error("[db-journal-doctor] 実行時エラー:", err);
  process.exit(1);
});
