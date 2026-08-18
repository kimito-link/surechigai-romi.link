#!/usr/bin/env node
/**
 * ネイティブ（Hermes）で落ちる DOM API の使い方を検出する。
 *
 * なぜ必要か（2026-08-19・iOS build 509/518 の Guideline 2.1(a) 却下）:
 *   `RestoreDeepLinkAfterAuthBoot` が `window.addEventListener` を
 *   `typeof window === "undefined"` だけのガードで呼んでいた。
 *   **React Native の Hermes には `window` は存在する**ので、このガードは
 *   すり抜ける。存在しないのは `addEventListener` の方で、結果
 *   `undefined is not a function` になり ErrorBoundary が
 *   「エラーが発生しました」を全画面に出す。審査官はこれを
 *   "an error displayed upon launch" と書いて却下してくる。
 *
 *   この不具合は tsc・テスト・lint・Web ビルドをすべて素通りする。
 *   ネイティブで実際に起動する以外に気づく方法がないので、ここで止める。
 *
 * 判定:
 *   window.addEventListener / document.* を使う行の手前に
 *   `Platform.OS` か `typeof document` のガードが無ければ NG。
 *
 * 実行: node scripts/check-native-unsafe-dom.mjs
 *
 * ⚠️ 既知の限界（2026-08-19 時点）:
 *   スコープ判定が甘く、**本物の不具合（app/_layout.tsx の
 *   RestoreDeepLinkAfterAuthBoot）を検出できない**ことを確認済み。
 *   同じファイル内の無関係な Platform ガードを拾ってしまうため。
 *   よって `pnpm check` には組み込んでいない。参考情報として使い、
 *   **これが緑でも「ネイティブで安全」とは言えない**。
 *   確実な検証は ios-crash-probe.yml（実機シミュレータで起動）で行うこと。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** ネイティブでも読まれうる場所だけを見る。 */
const SCAN_DIRS = ["app", "components", "hooks", "lib", "modules"];

/** Web 専用と明示されているファイルは対象外。 */
const SKIP_PATTERNS = [
  /\.web\.(t|j)sx?$/,      // *.web.tsx は Web 専用
  /[\/]\+html\.tsx$/,      // Expo Router の HTML シェル（Web のみ）
  /[\/]pwa[\/]/,          // PWA 系は Web 専用
  /[\/]__tests__[\/]/,
  /\.test\.(t|j)sx?$/,
];

/** これらを呼ぶ行が危険。 */
const RISKY = [
  /\bwindow\.addEventListener\b/,
  /\bwindow\.removeEventListener\b/,
  /\bdocument\.(readyState|querySelector|addEventListener|createElement|body|head)\b/,
];

/** 直前にこれがあれば守られているとみなす。 */
const GUARDS = [
  /Platform\.OS\s*!==\s*["']web["']/,
  /Platform\.OS\s*===\s*["']web["']/,
  /typeof\s+document\s*===\s*["']undefined["']/,
  /typeof\s+document\s*!==\s*["']undefined["']/,
  /typeof\s+window\.addEventListener\s*!==\s*["']function["']/,
];

/** ガードを探す遡り行数。関数の頭で弾く書き方を拾える程度に広く取る。 */
const LOOKBACK = 60;

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      walk(full, acc);
    } else if (/\.(t|j)sx?$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d), []));
const findings = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  if (SKIP_PATTERNS.some((p) => p.test(rel))) continue;

  const whole = fs.readFileSync(file, "utf8");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;
    if (!RISKY.some((r) => r.test(line))) continue;

    const from = Math.max(0, i - LOOKBACK);
    const context = lines.slice(from, i + 1).join("\n");
    if (GUARDS.some((g) => g.test(context))) continue;

    // 「同じ関数（useEffect）の中でガードされているか」だけを見る。
    // ファイル全体で判定すると、別の関数にある Platform ガードを理由に
    // 本物の不具合を見逃す（2026-08-19 に実際に見逃した）。
    let blockStart = from;
    for (let j = i; j >= from; j -= 1) {
      if (/useEffect\(|^\s*(export )?(async )?function |=>\s*\{\s*$/.test(lines[j])) {
        blockStart = j;
        break;
      }
    }
    if (blockStart >= 0) {
      const blockCtx = lines.slice(blockStart, i + 1).join(String.fromCharCode(10));
      if (GUARDS.some((g) => g.test(blockCtx))) continue;
    }

    findings.push({ file: rel, line: i + 1, code: line.trim().slice(0, 90) });
  }
}

if (findings.length > 0) {
  console.error(`[check-native-unsafe-dom] NG: ${findings.length}件`);
  for (const f of findings) {
    console.error(`  - ${f.file}:${f.line}`);
    console.error(`      ${f.code}`);
  }
  console.error("");
  console.error("Hermes には window はあるが addEventListener / document は無い。");
  console.error("`typeof window === \"undefined\"` だけのガードはすり抜ける。");
  console.error("直し方: 手前に `if (Platform.OS !== \"web\") return;` を置くか、");
  console.error("        実際に触る API の存在(`typeof document === \"undefined\"`)で判定する。");
  process.exit(1);
}

console.log(`[check-native-unsafe-dom] OK: ${files.length}ファイルに未ガードの DOM 参照なし`);
