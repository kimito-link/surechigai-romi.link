/**
 * .env / .env.local を読み込んでから drizzle-kit を実行するラッパー
 * drizzle-kit は自前で .env を読まないため、このスクリプトで環境変数を渡す
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

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
  execSync("npx drizzle-kit generate", { stdio: "inherit", env: process.env });
  execSync("npx drizzle-kit migrate", { stdio: "inherit", env: process.env });
} else if (command === "force-push") {
  execSync("npx drizzle-kit push", { stdio: "inherit", env: process.env });
} else {
  execSync(`npx drizzle-kit ${args.join(" ")}`, { stdio: "inherit", env: process.env });
}
