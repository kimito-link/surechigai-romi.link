#!/usr/bin/env node
/**
 * Hermes がバイトコード化できない依存を、ネイティブビルド前に検出する。
 *
 * なぜ必要か（2026-08-14 実障害）:
 * exifr を追加したら iOS の Release ビルドが落ちた。
 *   main.jsbundle:494786:18: error: Invalid expression encountered
 *     }(1))) : import(/* webpackIgnore: true *\/ e).then(t);
 * exifr の既定(full)ビルドは Node 用フォールバックとして動的 import を含み、
 * Hermes のバイトコード変換がこれを受け付けない。
 *
 * ★この壊れ方の特徴: **Web ビルドは通る**。tsc も通る。テストも通る。
 *   ネイティブをビルドして初めて分かるため、気づくのが一番遅い層にある。
 *   しかもリリースワークフローは20〜30分かかるので、発見コストが高い。
 *   だから「バンドルに入る import 文」を静的に見て、先に止める。
 *
 * 検査対象は**自分のソースが指しているモジュール指定子**だけにする。
 * node_modules 全体を走査すると、実際にはバンドルされないものまで拾って
 * 無意味に赤くなる（fail-closed のつもりが運用を止める）。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * 既知の危険なモジュールと、その安全な代替。
 * 「使うな」ではなく「こう書け」を示す（直し方が分からない警告は無視される）。
 */
const UNSAFE_SPECIFIERS = [
  {
    bad: "exifr",
    good: "exifr/dist/lite.esm.js",
    why: "既定(full)ビルドが動的 import を含み Hermes が弾く（iOS Release ビルドが失敗）",
  },
];

const SCAN_DIRS = ["app", "lib", "components", "hooks", "modules", "features"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

/** import 文・動的 import から、指定子だけを抜き出す */
function specifiersOf(source) {
  const out = [];
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(source)) !== null) out.push(m[1]);
  }
  return out;
}

function* walk(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      yield* walk(p);
    } else if (EXTS.has(path.extname(e.name))) {
      yield p;
    }
  }
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const src = fs.readFileSync(file, "utf8");
    for (const spec of specifiersOf(src)) {
      for (const rule of UNSAFE_SPECIFIERS) {
        // 完全一致だけを見る（"exifr/dist/lite.esm.js" は安全なので拾わない）
        if (spec === rule.bad) {
          violations.push({ file: path.relative(ROOT, file), ...rule });
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error("[check-hermes-unsafe-imports] Hermes が扱えない import があります:\n");
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    "${v.bad}" → "${v.good}" に変えること`);
    console.error(`    理由: ${v.why}\n`);
  }
  console.error("これを直さないと iOS/Android の Release ビルドが");
  console.error('"Invalid expression encountered" で失敗します（Webビルドは通るので気づけません）。');
  process.exit(1);
}

console.log(
  `[check-hermes-unsafe-imports] OK: Hermes が扱えない import はありません（${UNSAFE_SPECIFIERS.length}件の既知パターンを検査）`,
);
