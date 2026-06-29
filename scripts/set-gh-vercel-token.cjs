/**
 * Vercel CLI auth.json から VERCEL_TOKEN を GitHub Secrets に登録する。
 * トークン値は stdout に出さない。
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const authPaths = [
  path.join(process.env.APPDATA || "", "com.vercel.cli", "Data", "auth.json"),
  path.join(
    process.env.APPDATA || "",
    "xdg.data",
    "com.vercel.cli",
    "auth.json",
  ),
];

function readToken() {
  for (const p of authPaths) {
    if (!fs.existsSync(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (typeof j.token === "string" && j.token.length > 10) {
        return { token: j.token, source: p };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

const hit = readToken();
if (!hit) {
  console.error("auth.json に token が見つかりません");
  process.exit(1);
}

try {
  execSync("gh secret set VERCEL_TOKEN --repo kimito-link/surechigai-romi.link", {
    cwd: path.join(__dirname, ".."),
    input: hit.token,
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log("GitHub Secret VERCEL_TOKEN を登録しました");
} catch (err) {
  console.error("gh secret set に失敗しました");
  process.exit(1);
}
