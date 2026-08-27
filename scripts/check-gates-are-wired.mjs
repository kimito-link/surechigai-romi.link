#!/usr/bin/env node
/**
 * check-gates-are-wired.mjs
 * ★「作ったのに誰も呼ばない検査」を機械で見つける。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★なぜ要るか（このリポで2回起きている）
 *
 *   ① 2026-08-21: `check-native-unsafe-dom.mjs` は **iOS 518 却下**
 *      （Hermes に addEventListener が無く起動時に全画面エラー）を捕まえるための
 *      検査だったのに、★`pnpm check` にも CI にも登録されていなかった。
 *      ＝ **却下の検出役が、誰にも実行されないまま却下を通した**。
 *
 *   ② 2026-08-23: `check-symptom-index` は run.mjs に登録されていたが、
 *      置き場所の宣言が無く**毎回 skip** していた。
 *      ★skip する検査は、存在しない検査と同じ。
 *
 *   ★どちらも「検査を書いた」時点で満足してしまったのが原因。
 *   検査は**呼ばれて初めて意味を持つ**。だからそこを機械で数える。
 *
 * ■ ★何を見るか
 *   scripts/ 配下の check-* / verify-* が、次のどれかから参照されているか:
 *     ・package.json の scripts
 *     ・.github/workflows/ のいずれか
 *     ・scripts/diagnostics/run.mjs（診断キットのランナー）
 *
 * ■ ★強制しない（このリポの掟）
 *   「必ず pnpm check に入れろ」にすると、重い検査まで毎回走って
 *   通すためだけに検査を弱める動機が生まれる。
 *   ★ベースライン＋ラチェット。**孤児が増えたときだけ赤**。減らすのは自由。
 *
 * ■ ★この検査が判定しないこと
 *   ・呼ばれた検査が正しく動くかは見ない（呼ばれるかだけ）
 *   ・skip したまま緑になっていないかは見ない（それは各検査の責任）
 *   ・文字列一致で数えるので、動的に組み立てる呼び出しは拾えない
 *
 * 使い方:
 *   node scripts/check-gates-are-wired.mjs
 *   node scripts/check-gates-are-wired.mjs --selftest
 * ───────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { EXIT, computeExitCode, formatProbeReport } from "./lib/instrument-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * ★ここを超えて「誰にも呼ばれない検査」が増えたら赤。
 *   ★既定は 0。今この瞬間、孤児は1本も無い（実測）。
 *   増やすときは**なぜ呼ばれなくてよいのか**を必ず添えること。
 */
export const ORPHAN_MAX = 0;

/** 検査とみなすファイル名。 */
const GATE_RE = /^(check|verify)-.*\.mjs$/;

/** 呼び出し元として認める場所。 */
function callerTexts() {
  const texts = [];
  const pkg = join(ROOT, "package.json");
  if (existsSync(pkg)) texts.push(readFileSync(pkg, "utf8"));

  const wf = join(ROOT, ".github", "workflows");
  if (existsSync(wf)) {
    for (const f of readdirSync(wf)) {
      if (/\.ya?ml$/.test(f)) texts.push(readFileSync(join(wf, f), "utf8"));
    }
  }
  const runner = join(ROOT, "scripts", "diagnostics", "run.mjs");
  if (existsSync(runner)) texts.push(readFileSync(runner, "utf8"));
  return texts;
}

/** 検査ファイルを集める（scripts/ 直下と scripts/qa/ と scripts/diagnostics/）。 */
function collectGates() {
  const dirs = ["scripts", "scripts/qa", "scripts/diagnostics"];
  const out = [];
  for (const d of dirs) {
    const abs = join(ROOT, d);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (GATE_RE.test(f)) out.push({ dir: d, name: f });
    }
  }
  return out;
}

/** 呼ばれていない検査を返す（純ロジック・テスト可）。 */
export function findOrphans(gates, texts) {
  return gates
    .filter((g) => !texts.some((t) => t.includes(g.name)))
    .map((g) => `${g.dir}/${g.name}`);
}

/* ── --selftest: 毒→赤 ─────────────────────────────────────── */
if (process.argv.includes("--selftest")) {
  const cases = [
    {
      name: "★呼ばれていない検査を見つける",
      run: () =>
        findOrphans([{ dir: "scripts", name: "check-x.mjs" }], ["何も書いていない"]).length === 1,
    },
    {
      name: "呼ばれている検査は孤児にしない",
      run: () =>
        findOrphans(
          [{ dir: "scripts", name: "check-x.mjs" }],
          ["node scripts/check-x.mjs"],
        ).length === 0,
    },
    {
      name: "★呼び出し元が1つも無いときに緑にしない",
      run: () => findOrphans([{ dir: "scripts", name: "check-x.mjs" }], []).length === 1,
    },
    {
      name: "検査が0本なら「測れなかった」に倒せる形か",
      run: () => findOrphans([], ["何か"]).length === 0,
    },
  ];
  const fails = [];
  for (const c of cases) {
    let ok = false;
    try {
      ok = c.run() === true;
    } catch (e) {
      fails.push(`${c.name}: 例外 ${e.message}`);
      continue;
    }
    if (!ok) fails.push(`${c.name}: ★期待どおりに動かなかった`);
  }
  if (fails.length) {
    console.error("[check-gates-are-wired --selftest] 🔴 検査自体が壊れています:");
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(EXIT.FAIL);
  }
  console.log(`[check-gates-are-wired --selftest] ✅ ${cases.length}件すべて期待どおり。`);
  process.exit(EXIT.PASS);
}

/* ── 本体 ─────────────────────────────────────────────────── */
const gates = collectGates();
const texts = callerTexts();
const results = [];

if (gates.length === 0) {
  // ★検査が1本も見つからない＝合格ではない。読み方が変わった可能性がある。
  results.push({
    probe: "検査の実行経路",
    verdict: "inconclusive",
    evidence: null,
    detail: "check-* / verify-* が1本も見つかりません",
    howToFix: "リポジトリのルートで実行しているか確認する",
  });
} else if (texts.length === 0) {
  results.push({
    probe: "検査の実行経路",
    verdict: "inconclusive",
    evidence: null,
    detail: "package.json も workflows も読めませんでした",
    howToFix: "リポジトリのルートで実行しているか確認する",
  });
} else {
  const orphans = findOrphans(gates, texts);
  results.push(
    orphans.length > ORPHAN_MAX
      ? {
          probe: "検査の実行経路",
          verdict: "fail",
          evidence: { 検査: gates.length, 孤児: orphans.length },
          detail:
            `★誰にも呼ばれない検査が ${orphans.length} 本あります（上限 ${ORPHAN_MAX}）:\n    ` +
            orphans.join("\n    "),
          howToFix:
            "package.json の scripts / .github/workflows / scripts/diagnostics/run.mjs " +
            "のいずれかに登録する。呼ばれない検査は、存在しない検査と同じです",
          limitation: "呼ばれた検査が正しく動くかは判定しません（呼ばれるかだけ）",
        }
      : {
          probe: "検査の実行経路",
          verdict: "pass",
          evidence: { 検査: gates.length, 孤児: orphans.length },
          limitation: "呼ばれた検査が正しく動くかは判定しません（呼ばれるかだけ）",
        },
  );
}

console.log(formatProbeReport(results, { label: "check-gates-are-wired" }));
process.exit(computeExitCode(results));
