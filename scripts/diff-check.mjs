#!/usr/bin/env node
/**
 * Gate 1: 危険変更検知（ルールは config で差し替え可能）
 * scripts/diff-check.config.json を読んで dangerousPaths / forbiddenWords を適用。
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DIFF_BASE || "origin/main";
const HEAD = process.env.DIFF_HEAD || "HEAD";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf-8");
}

function loadRules() {
  const configPath = join(__dirname, "diff-check.config.json");
  if (!existsSync(configPath)) {
    console.error("Missing scripts/diff-check.config.json");
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(configPath, "utf-8"));
  return {
    dangerFiles: Array.isArray(raw.dangerFiles) ? raw.dangerFiles : [],
    forbiddenWords: Array.isArray(raw.forbiddenWords) ? raw.forbiddenWords : [],
  };
}

function main() {
  const rules = loadRules();
  const files = sh(`git diff --name-only ${BASE}...${HEAD}`)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const diffText = sh(`git diff ${BASE}...${HEAD}`);

  const matchedDanger = files.filter((f) =>
    rules.dangerFiles.some(
      (p) => f === p || f.startsWith(p + "/") || (f.startsWith(p) && (f[p.length] === "." || f[p.length] === "/"))
    )
  );

  const matchedForbidden = rules.forbiddenWords.filter((w) =>
    diffText.includes(w)
  );

  console.log("=== diff-check report ===");
  console.log("BASE:", BASE);
  console.log("HEAD:", HEAD);
  console.log("Changed files:", files.length);
  files.forEach((f) => console.log(" -", f));

  if (matchedDanger.length) {
    console.log("\n[BLOCK] Dangerous paths touched:");
    matchedDanger.forEach((f) => console.log(" -", f));
  }

  if (matchedForbidden.length) {
    console.log("\n[BLOCK] Forbidden words in diff:");
    matchedForbidden.forEach((w) => console.log(" -", w));
  }

  if (matchedDanger.length) {
    console.error("\n❌ Gate1 blocked: dangerous paths were modified.");
    process.exit(1);
  }

  if (matchedForbidden.length) {
    console.error("\n❌ Gate1 blocked: forbidden words in diff.");
    process.exit(1);
  }

  console.log("\n✅ Gate1 ok: no dangerous paths or forbidden words.");
}

main();
