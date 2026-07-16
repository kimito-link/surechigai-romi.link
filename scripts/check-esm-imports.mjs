#!/usr/bin/env node
/**
 * server/・api/・modules/配下の相対importに拡張子（.js/.json）が付いているかを検査する。
 *
 * TypeScriptのtsc --noEmitは拡張子省略importをTS2835警告として出すだけでビルドは通すが、
 * Vercel FunctionsのNode ESM実行環境では実際にモジュール解決が失敗しランタイムエラーになる
 * （2026-07-06、/api/sweepが本番で全数落ちる障害の原因）。
 * modules/ は server/ からランタイムでimportされるため対象に含める（2026-07-14追加）。
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGET_DIRS = ["server", "api", "modules"];
const IMPORT_RE = /(?:from\s+|import\s*\(\s*)["'](\.[^"']+)["']/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let violations = [];

for (const dir of TARGET_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    IMPORT_RE.lastIndex = 0;
    while ((match = IMPORT_RE.exec(content)) !== null) {
      const spec = match[1];
      if (!/\.(js|json|jsx|mjs|cjs)$/.test(spec)) {
        const line = content.slice(0, match.index).split("\n").length;
        violations.push({ file: path.relative(ROOT, file), line, spec });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`[check-esm-imports] 拡張子省略の相対importが${violations.length}件見つかりました:`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  "${v.spec}"`);
  }
  console.error(
    "\nVercel FunctionsのESM実行環境ではこれらは解決に失敗します。" +
      '".js" 拡張子を明記してください（例: "./foo" → "./foo.js"）。',
  );
  process.exit(1);
}

console.log("[check-esm-imports] OK: server/・api/・modules/配下に拡張子省略importはありません");
