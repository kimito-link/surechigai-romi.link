#!/usr/bin/env node
/**
 * 主要ルートの Lighthouse accessibility スコアを計測
 * Usage: pnpm pagespeed:a11y
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.argv.find((a) => a.startsWith("--base="))?.slice(7) ?? "https://surechigai.kimito.link";

const ROUTES = ["/map", "/checkin", "/zukan", "/sign-in", "/install-instructions"];

let failed = false;
for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  const out = resolve(`pagespeed-a11y${route.replace(/\//g, "-") || "-root"}.json`);
  console.log(`\n=== ${url} ===`);
  const lh = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "lighthouse@12",
      url,
      "--only-categories=accessibility",
      "--form-factor=mobile",
      "--quiet",
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
      `--output=json`,
      `--output-path=${out}`,
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (lh.status !== 0) {
    failed = true;
    continue;
  }
  try {
    const report = JSON.parse(readFileSync(out, "utf8"));
    const score = report.categories?.accessibility?.score;
    const pct = score != null ? Math.round(score * 100) : "?";
    console.log(`accessibility: ${pct}`);
    if (typeof score === "number" && score < 0.9) failed = true;
  } catch {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
