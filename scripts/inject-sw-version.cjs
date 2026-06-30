/**
 * dist/sw.js の CACHE_VERSION プレースホルダを commitSha で置換する。
 * vercel-build.sh の expo export 後に実行する。
 */
const fs = require("fs");
const path = require("path");

const DIST_SW = path.join(process.cwd(), "dist", "sw.js");
const PLACEHOLDER = "__CACHE_VERSION__";

function resolveSha(val) {
  if (!val || typeof val !== "string") return null;
  if (val.startsWith("$") || val === "VERCEL_GIT_COMMIT_SHA") return null;
  return val;
}

let commitSha =
  resolveSha(process.env.GITHUB_SHA) ||
  resolveSha(process.env.VERCEL_GIT_COMMIT_SHA) ||
  resolveSha(process.env.COMMIT_SHA);

if (!commitSha) {
  try {
    commitSha = require("child_process")
      .execSync("git rev-parse HEAD", { encoding: "utf-8" })
      .trim();
  } catch {
    commitSha = `local-${Date.now()}`;
  }
}

const version = `v3-${commitSha.replace(/[^0-9a-zA-Z._-]/g, "-").slice(0, 40)}`;

if (!fs.existsSync(DIST_SW)) {
  console.log("[inject-sw-version] dist/sw.js not found, skip");
  process.exit(0);
}

const before = fs.readFileSync(DIST_SW, "utf8");
if (!before.includes(PLACEHOLDER)) {
  console.log("[inject-sw-version] placeholder not found, skip");
  process.exit(0);
}

const after = before.replaceAll(PLACEHOLDER, version);
fs.writeFileSync(DIST_SW, after);
console.log(`[inject-sw-version] CACHE_VERSION=${version}`);
