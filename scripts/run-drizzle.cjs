/**
 * .env / .env.local を読み込んでから drizzle-kit を実行するラッパー
 * drizzle-kit は自前で .env を読まないため、このスクリプトで環境変数を渡す
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * drizzle-kit generate は、schema/index.ts の ".js" 拡張子importをこの環境の
 * ローダーが解決できず内部でエラーになっても、exit code 0 を返すことがある
 * （2026-07-06発見。"型チェックは通るがランタイムで壊れる"の別バリエーション）。
 * stdio:"inherit" だと出力を検査できないため、ここだけ出力をキャプチャして
 * エラーの痕跡が無いか確認する。
 */
function execAndCheckForSilentFailure(command) {
  // stdio: "pipe" にして stdout・stderr 両方を捕まえる（inherit だと戻り値に乗らない）
  const result = require("child_process").spawnSync(command, {
    shell: true,
    env: process.env,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);
  if (/Cannot find module|MODULE_NOT_FOUND/.test(output)) {
    console.error(
      `\n[run-drizzle] "${command}" が内部エラーを出しつつ exit code 0 で終了しました。` +
        "スキーマ変更が反映されていない可能性があります。手動で `npx drizzle-kit generate` を実行し、" +
        "出力にエラーが無いか確認してください。",
    );
    process.exit(1);
  }
}

// プロジェクトルート = このスクリプトがあるディレクトリの親（cwd に依存しない）
const scriptDir = path.resolve(__dirname);
const projectRoot = path.dirname(scriptDir);
const envPaths = [
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, ".env"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
  }
}

// フォールバック: 行ごとに DATABASE_URL= を探して値を取り出す（BOM・改行コードに強い）
function readDatabaseUrlFromFile(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");
  raw = raw.replace(/^\uFEFF/, ""); // BOM 除去
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
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
    try {
      const value = readDatabaseUrlFromFile(envPath);
      if (value) {
        process.env.DATABASE_URL = value;
        break;
      }
    } catch (_) { }
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  for (const p of envPaths) {
    console.error("  ", p, fs.existsSync(p) ? "(exists)" : "(not found)");
  }
  console.error("Put DATABASE_URL in .env.local in the project root, or run: export DATABASE_URL='postgresql://...'");
  process.exit(1);
}

const args = process.argv.slice(2);
const command = args[0] || "push"; // push = generate + migrate

if (command === "push" || command === "db:push") {
  execSync(`node ${path.join(scriptDir, "db-journal-doctor.cjs")}`, {
    stdio: "inherit",
    env: process.env,
  });
  execAndCheckForSilentFailure("npx drizzle-kit generate");
  execSync("npx drizzle-kit migrate", { stdio: "inherit", env: process.env });
} else if (command === "force-push") {
  execSync("npx drizzle-kit push", { stdio: "inherit", env: process.env });
} else {
  execSync(`npx drizzle-kit ${args.join(" ")}`, { stdio: "inherit", env: process.env });
}
