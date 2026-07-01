#!/usr/bin/env node
/**
 * 主要ルートの Lighthouse accessibility スコアを計測（並列）
 * Usage: pnpm pagespeed:a11y
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ?? "https://surechigai.kimito.link";

const ROUTES = ["/map", "/checkin", "/zukan", "/sign-in", "/install-instructions"];

function runLighthouse(url, outPath) {
  return new Promise((done) => {
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(
      npx,
      [
        "lighthouse@12",
        url,
        "--only-categories=accessibility",
        "--form-factor=mobile",
        "--throttling-method=simulate",
        "--quiet",
        "--chrome-flags=--headless --no-sandbox --disable-gpu",
        "--output=json",
        `--output-path=${outPath}`,
      ],
      { stdio: "inherit", shell: process.platform === "win32" },
    );
    child.on("close", (code) => done({ code: code ?? 1, url, outPath }));
  });
}

const results = await Promise.all(
  ROUTES.map(async (route) => {
    const url = `${BASE}${route}`;
    const out = resolve(`pagespeed-a11y${route.replace(/\//g, "-") || "-root"}.json`);
    console.log(`\n=== start ${url} ===`);
    return runLighthouse(url, out);
  }),
);

let failed = false;
for (const { code, url, outPath } of results) {
  console.log(`\n=== ${url} ===`);
  if (code !== 0) {
    failed = true;
    continue;
  }
  try {
    const report = JSON.parse(readFileSync(outPath, "utf8"));
    const score = report.categories?.accessibility?.score;
    const pct = score != null ? Math.round(score * 100) : "?";
    console.log(`accessibility: ${pct}`);
    if (typeof score === "number" && score < 0.9) failed = true;
  } catch {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
