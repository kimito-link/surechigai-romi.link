#!/usr/bin/env node
/**
 * ネイティブの JS バンドルに Clerk の公開鍵が埋め込まれているか確かめる。
 *
 * なぜ必要か（2026-08-17）:
 *   iOS build 509 が Guideline 2.1(a)「Error on launch」で却下された。
 *   真因は、リリース workflow が EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY を
 *   渡しておらず、Metro が値を埋め込めなかったこと。アプリは起動するが
 *   「セットアップエラー: Clerkの公開鍵が設定されていません」の画面で止まる。
 *   Android のリリースにも同じ穴があった。
 *
 *   この不具合は tsc・テスト・lint・ビルドのすべてを素通りする。
 *   ビルド成果物を見る以外に気づく方法がないので、ここで止める。
 *
 * 使い方:
 *   node scripts/verify-bundle-has-clerk-key.mjs <バンドルまたは.appのパス>
 *
 * 終了コード: 埋め込まれていなければ 1
 */

import fs from "node:fs";
import path from "node:path";

/** Clerk ライブラリ内部の定数。これは「鍵が入っている」証拠にならない。 */
const DECOYS = new Set(["pk_live_IsomorphicClerk", "pk_test_IsomorphicClerk"]);

/** Hermes バイトコードからも読めるよう、印字可能 ASCII の連なりを拾う。 */
function extractStrings(buf, minLen = 8) {
  const out = [];
  let cur = "";
  for (let i = 0; i < buf.length; i += 1) {
    const c = buf[i];
    if (c >= 32 && c < 127) {
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= minLen) out.push(cur);
      cur = "";
    }
  }
  if (cur.length >= minLen) out.push(cur);
  return out;
}

function findBundle(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target;
  // .app / ディレクトリを渡された場合は中から探す
  const candidates = [];
  const walk = (dir, depth) => {
    if (depth > 4) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (/\.(jsbundle|bundle)$/.test(e.name) || e.name === "index.android.bundle") {
        candidates.push(full);
      }
    }
  };
  walk(target, 0);
  if (candidates.length === 0) {
    console.error(`[verify-clerk-key] バンドルが見つからない: ${target}`);
    process.exit(1);
  }
  // 一番大きいものを本体とみなす
  return candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
}

const target = process.argv[2];
if (!target || !fs.existsSync(target)) {
  console.error("使い方: node scripts/verify-bundle-has-clerk-key.mjs <バンドル|.app>");
  process.exit(1);
}

const bundle = findBundle(target);
const buf = fs.readFileSync(bundle);
const strings = extractStrings(buf);

const keys = new Set();
for (const s of strings) {
  const matches = s.match(/pk_(?:live|test)_[A-Za-z0-9+/=]{8,}/g);
  if (matches) for (const m of matches) keys.add(m);
}

/**
 * 本物かどうかは「base64 部分をデコードすると Clerk の Frontend API ドメインになる」
 * ことで判定する。Hermes のバイトコードは文字列テーブルが連結されているため、
 * 単に pk_live_ で始まるだけの偶然の一致が出る
 * （実際 "pk_test_J2__N2__webpack_require__..." という236文字の誤検知が出た）。
 */
function looksLikeRealKey(key) {
  if (DECOYS.has(key)) return false;
  const body = key.replace(/^pk_(live|test)_/, "");
  try {
    const decoded = Buffer.from(body, "base64").toString("utf8");
    // 例: "clerk.example.com$" のような形になる
    return /^[a-z0-9.-]+\.[a-z]{2,}\$?$/i.test(decoded.trim());
  } catch {
    return false;
  }
}

const real = [...keys].filter(looksLikeRealKey);

console.log(`[verify-clerk-key] バンドル: ${path.basename(bundle)}`);
console.log(`[verify-clerk-key] 検出した pk_: ${keys.size}件 / 実鍵: ${real.length}件`);

if (real.length === 0) {
  console.error("");
  console.error("[verify-clerk-key] NG: Clerk の公開鍵が埋め込まれていない。");
  console.error("  この状態のアプリは起動直後に「セットアップエラー」画面で止まり、");
  console.error("  審査では Guideline 2.1(a) 「Error on launch」で却下される。");
  console.error("");
  console.error("  直し方: リリース workflow の env に");
  console.error("    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY }}");
  console.error("  を渡す（バンドル生成より前に環境変数として存在している必要がある）。");
  if (keys.size > 0) {
    console.error("");
    console.error(`  なお検出した ${[...keys].join(", ")} は Clerk 内部の定数で、実鍵ではない。`);
  }
  process.exit(1);
}

// 値そのものはログに出さない（公開鍵だが、置き場所を一箇所に保つ）
const sample = real[0];
console.log(`[verify-clerk-key] OK: ${sample.slice(0, 11)}…（${sample.length}文字）`);
