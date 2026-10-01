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

  // ★追加行だけを走査する（2026-10-01 修正）。
  //   以前は `git diff` の生テキストを includes() で見ていたため、
  //     ・禁止語を含む行を【削除】した差分
  //     ・禁止語を含む既存行の【近く】に追記しただけの差分（＝前後の文脈行）
  //   まで赤くなっていた。本来の目的は「新しく禁止語を持ち込ませない」ことなので、
  //   掃除する変更や近くを直す変更まで止めるのは逆向き。
  //   実例: _docs/ の手順書へ追記したところ、自分の追加行に禁止語ゼロなのに
  //   既存行が文脈として出て BLOCK された（言い換えでも削除でも回避できなかった）。
  //   ★"+++ b/path" のファイルヘッダは除く（パスに禁止語が入ると誤検知するため）。
  //   ★毒テスト済み: 禁止語を追加行としてコミットすると赤くなることを実機で確認。
  const diffText = sh(`git diff ${BASE}...${HEAD}`)
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .join("\n");

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
