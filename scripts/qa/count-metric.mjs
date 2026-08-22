#!/usr/bin/env node
/**
 * scripts/qa/count-metric.mjs
 *
 * 進化台帳(improvement-metrics.mjs)の `auto: { kind: 'command-number' }` 用に、
 * **数字を1つだけ**標準出力へ出す小さな計数器。
 *
 * ★数字1つしか出さないのは、呼び出し側が「最初に見つかった数字」を採るため。
 *   余計な文字に数字が混ざると、そちらを拾って**間違った値が台帳に載る**。
 *
 * ★測れなかったときは数字を出さずに exit 1 する。
 *   ここで 0 を返すと「0件だった」と「測れなかった」が区別できなくなる
 *   （このリポは 2026-08-22 に、走査0件を合格と報告する検査で実際に刺された）。
 *
 * 使い方:
 *   node scripts/qa/count-metric.mjs tests-passed      通っているテストの数
 *   node scripts/qa/count-metric.mjs gates             pnpm check が回すゲートの本数
 *   node scripts/qa/count-metric.mjs selftest-missing  selftest を持たない検査の数
 */
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const what = process.argv[2];

/** 通っているテストの数（vitest の出力から拾う）。 */
function testsPassed() {
  // ★vitest は集計行(Tests 851 passed)を **stderr** に書く。
  //   stdout だけ見ると取れず「測れなかった」に倒れる（2026-08-23 に実際に踏んだ）。
  //   → シェル経由で 2>&1 に寄せてから読む。
  const out = execSync("npx vitest run --reporter=basic 2>&1", {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 600000,
    maxBuffer: 32 * 1024 * 1024,
  });
  // ★色付けのエスケープが "Tests" と数字の間に入るので、先に落とす。
  //   落とさないと正規表現が当たらず「測れなかった」に倒れる（2026-08-23 に実際に踏んだ）。
  const clean = String(out).replace(/\x1b\[[0-9;]*m/g, "");
  const m = clean.match(/Tests\s+(\d+)\s+passed/);
  return m ? Number(m[1]) : null;
}

/** pnpm check が実際に回すゲートの本数（package.json の check スクリプトを読む）。 */
function gates() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const cmd = String(pkg?.scripts?.check || "");
  if (!cmd) return null;
  // `node scripts/xxx.mjs` の出現数を数える（--selftest 付きの重複は1本として数える）
  const hits = [...cmd.matchAll(/node\s+(scripts\/[\w./-]+\.mjs)/g)].map((m) => m[1]);
  const uniq = new Set(hits);
  return uniq.size === 0 ? null : uniq.size;
}

/** selftest を持たない検査の数（scripts/ 直下と scripts/qa/ の check-*.mjs を見る）。 */
function selftestMissing() {
  const dirs = [join(ROOT, "scripts"), join(ROOT, "scripts", "qa")];
  let total = 0;
  let missing = 0;
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!/^check-.*\.mjs$/.test(f)) continue;
      total += 1;
      const src = readFileSync(join(d, f), "utf8");
      // ★名前だけを見ない。コメントを除いた実コードで --selftest を読んでいるか。
      const code = src
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .split("\n")
        .map((l) => l.replace(/\/\/.*$/, ""))
        .join("\n");
      if (!/--selftest/.test(code)) missing += 1;
    }
  }
  return total === 0 ? null : missing;
}

const table = {
  "tests-passed": testsPassed,
  gates,
  "selftest-missing": selftestMissing,
};

const fn = table[what];
if (!fn) {
  console.error(`使い方: count-metric.mjs <${Object.keys(table).join("|")}>`);
  process.exit(1);
}

let value = null;
try {
  value = fn();
} catch (e) {
  console.error(`測れませんでした: ${String(e).slice(0, 120)}`);
  process.exit(1);
}

if (value === null || !Number.isFinite(value)) {
  // ★0を出さない。「測れなかった」を「0件」と読ませない。
  console.error("測れませんでした（値を確定できない）");
  process.exit(1);
}

console.log(String(value));
