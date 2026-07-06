#!/usr/bin/env node
/**
 * セッション開始時に実行するヘルスチェック。
 *
 * handoffドキュメントが「次モデルは必ずやれ」と書いていた手作業（git fetch確認・
 * worktree list確認・最新handoffファイルの所在確認）を1コマンドに集約する。
 * 加えてDBジャーナルの整合性・未pushコミットの有無も確認する。
 *
 * 経緯: 複数のAIエージェントが並行して同じリポジトリにpushする体制で、
 * 「別セッションの成果物に気づかず進めてしまう」事故が2回起きている
 * （docs/uxux-stability-audit-SPEC.md Part 3 §3.1）。
 *
 * 使い方: node scripts/session-doctor.mjs
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch (err) {
    return `ERROR: ${err.message}`;
  }
}

console.log("=== session-doctor ===\n");

// 1. git fetch + origin/mainとの差分確認
console.log("--- 1. origin/main との差分 ---");
run("git fetch origin main");
const ahead = run("git log --oneline HEAD..origin/main");
if (ahead) {
  console.log("⚠️  ローカルがorigin/mainより遅れています。以下のコミットに気づいていない可能性:");
  console.log(ahead);
} else {
  console.log("OK: ローカルはorigin/mainに追いついています");
}

// 2. 未pushコミットの確認
console.log("\n--- 2. 未pushコミット ---");
const unpushed = run("git log --oneline origin/main..HEAD");
if (unpushed) {
  console.log("⚠️  未pushのコミットがあります:");
  console.log(unpushed);
} else {
  console.log("OK: 未pushコミットはありません");
}

// 3. worktree一覧・孤立ブランチの確認
console.log("\n--- 3. worktree一覧 ---");
console.log(run("git worktree list"));

// 4. 最新handoffファイルの所在
console.log("\n--- 4. 最新handoffファイル ---");
const docsDir = path.join(ROOT, "docs");
const handoffFiles = fs
  .readdirSync(docsDir)
  .filter((f) => f.startsWith("handoff-"))
  .sort();
if (handoffFiles.length > 0) {
  console.log(`最新: docs/${handoffFiles[handoffFiles.length - 1]}`);
  if (handoffFiles.length > 1) {
    console.log(`（他に${handoffFiles.length - 1}件のhandoffファイルあり。古いものは参考程度に）`);
  }
} else {
  console.log("handoffファイルが見つかりません");
}

// 5. DBジャーナルの整合性（db-journal-doctor.cjsを呼ぶ）
console.log("\n--- 5. DBマイグレーション整合性 ---");
console.log(run(`node ${path.join(ROOT, "scripts", "db-journal-doctor.cjs")}`));

console.log("\n=== session-doctor 完了 ===");
