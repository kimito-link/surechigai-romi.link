#!/usr/bin/env node
/**
 * axe-core で主要ページの WCAG 2.0/2.1 A+AA 違反を検出する。
 *
 * kimito-link の tests/node/test-axe-wcag-key-pages.js を移植したもの。
 * 移植時に surechigai 向けへ変えた点:
 *
 *   - kimito-link は静的HTMLをローカルサーバで配って検査していたが、
 *     surechigai は SPA なので「本番URL（既定）または --base で渡した
 *     オリジン」に対して実行する。ハイドレーション待ちを入れないと
 *     空の DOM を検査してしまうため、ネットワーク静穏まで待つ。
 *   - 未ログインで到達できるルートのみを対象にする。認証後の画面は
 *     auth-state が要るので、ここでは扱わない（e2e:audit 側の担当）。
 *
 * 実行:
 *   node scripts/qa/axe-a11y-check.mjs
 *   node scripts/qa/axe-a11y-check.mjs --base http://localhost:8081
 *
 * 終了コード: serious / critical が1件でもあれば 1
 */

import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const DEFAULT_BASE = "https://surechigai.kimito.link";

/** 未ログインで到達できるページだけを並べる。 */
const ROUTES = [
  { path: "/", name: "トップ(ゲスト)" },
  { path: "/map", name: "軌跡タブ(ゲスト)" },
  { path: "/zukan", name: "図鑑タブ(ゲスト)" },
  { path: "/sign-in", name: "ログイン" },
  { path: "/privacy", name: "プライバシーポリシー" },
  { path: "/terms", name: "利用規約" },
];

/**
 * 404 に落ちていないことを本文で確かめる。
 * SPA は存在しないパスでも HTTP 200 を返すため、ステータスだけでは
 * 「ルートが実在するか」を判定できない（実際 /legal/terms を検査対象に
 * していて、404 画面に対して axe を回していた）。
 */
const NOT_FOUND_MARKER = "ページが見つかりません";

/** これ未満の深刻度は報告するが失敗にはしない。 */
const FAIL_IMPACTS = new Set(["serious", "critical"]);

/**
 * サードパーティ DOM は自前で直せないので検査から外す。
 * 自分のマークアップだけを対象にするための除外。
 */
const EXCLUDE_SELECTORS = [["iframe"]];

function parseArgs(argv) {
  const args = { base: DEFAULT_BASE };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--base" && argv[i + 1]) {
      args.base = argv[i + 1].replace(/\/$/, "");
      i += 1;
    }
  }
  return args;
}

async function analyzeRoute(page, base, route) {
  const url = `${base}${route.path}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // SPA は最初の paint 時点では空。描画が落ち着くまで待たないと
  // 「違反ゼロ」という嘘の緑が出る。
  await page
    .waitForLoadState("networkidle", { timeout: 30000 })
    .catch(() => {});

  // 404 画面を検査しても意味がない。存在しないパスを対象に書いていても
  // SPA は 200 を返すので、本文を見て気づけるようにする。
  const body = await page.evaluate(() => document.body.innerText);
  if (body.includes(NOT_FOUND_MARKER)) {
    throw new Error(`404 画面が表示された（ルートを確認: ${route.path}）`);
  }
  if (body.trim().length < 30) {
    throw new Error(`本文がほぼ空（描画に失敗した可能性: ${route.path}）`);
  }

  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
  for (const selector of EXCLUDE_SELECTORS) {
    builder = builder.exclude(selector);
  }

  const result = await builder.analyze();
  return result.violations.map((v) => ({
    route: route.name,
    url,
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    sample: v.nodes[0]?.target?.join(" ") ?? "",
  }));
}

const { base } = parseArgs(process.argv);
console.log(`[axe-a11y] 対象: ${base}（${ROUTES.length}ルート）`);

const browser = await chromium.launch();
const findings = [];
let failed = 0;

try {
  // axe は newPage() で作った既定コンテキストを受け付けない。
  // 明示的に context を作ってから page を開く。
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  for (const route of ROUTES) {
    try {
      const violations = await analyzeRoute(page, base, route);
      findings.push(...violations);
      const bad = violations.filter((v) => FAIL_IMPACTS.has(v.impact)).length;
      const mark = bad > 0 ? "NG" : "ok";
      console.log(`  ${mark}  ${route.name} — 違反${violations.length}件（重大${bad}件）`);
    } catch (err) {
      // 1ルートの失敗で全体を落とさない。ただし黙って通さない。
      console.log(`  ERR ${route.name} — ${err.message}`);
      failed += 1;
    }
  }
} finally {
  await browser.close();
}

const serious = findings.filter((f) => FAIL_IMPACTS.has(f.impact));

if (findings.length > 0) {
  console.log("");
  console.log("--- 検出した違反 ---");
  for (const f of findings) {
    const flag = FAIL_IMPACTS.has(f.impact) ? "*" : " ";
    console.log(`${flag} [${f.impact}] ${f.route}: ${f.id} (${f.nodes}箇所)`);
    console.log(`    ${f.help}`);
    if (f.sample) console.log(`    例: ${f.sample}`);
  }
}

console.log("");
if (serious.length > 0) {
  console.error(
    `[axe-a11y] NG: serious/critical が ${serious.length}件（* 印）。上から直す。`,
  );
  process.exit(1);
}
if (failed > 0) {
  console.error(`[axe-a11y] NG: ${failed}ルートが検査できなかった。`);
  process.exit(1);
}
console.log(
  `[axe-a11y] OK: serious/critical なし（軽微 ${findings.length}件は報告のみ）`,
);
