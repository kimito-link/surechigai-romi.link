#!/usr/bin/env node
/**
 * 本番 URL を Lighthouse (mobile) で計測。PSI 手動スクショ不要。
 *
 * Usage:
 *   pnpm pagespeed
 *   pnpm pagespeed -- --url=https://surechigai.kimito.link/
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const url =
  process.argv.find((a) => a.startsWith("--url="))?.slice(6) ??
  "https://surechigai.kimito.link/";
const out = resolve("pagespeed-report.json");

const lh = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "lighthouse@12",
    url,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--form-factor=mobile",
    "--screenEmulation.mobile=true",
    "--throttling-method=simulate",
    "--quiet",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
    `--output=json`,
    `--output-path=${out}`,
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);

if (lh.status !== 0) {
  process.exit(lh.status ?? 1);
}

const sum = spawnSync(process.execPath, ["scripts/pagespeed-summarize.mjs", out], {
  stdio: "inherit",
});
process.exit(sum.status ?? 0);
