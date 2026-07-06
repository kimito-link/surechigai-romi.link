import { defineConfig } from "drizzle-kit";
import path from "path";
import { config } from "dotenv";

// drizzle-kit は .env を自動読み込みしないため、ここで読み込む
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required to run drizzle commands.\n" +
    "Railway: プロジェクト設定 > Postgres > Connect > 外部URL(Public Network) を .env.local に設定してください。\n" +
    "例: DATABASE_URL=postgresql://postgres:[password]@[host].proxy.rlwy.net:[port]/railway"
  );
}

export default defineConfig({
  // drizzle-kit専用エントリを使う理由: drizzle/schema/index.ts の ".js" 拡張子付きexportを
  // drizzle-kitの内部ローダーが解決できないため（2026-07-06発見）。
  // drizzle/schema/index.drizzle-kit.ts 側のコメント参照。
  schema: "./drizzle/schema/index.drizzle-kit.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
