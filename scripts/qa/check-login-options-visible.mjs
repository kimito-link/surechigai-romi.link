#!/usr/bin/env node
/**
 * check-login-options-visible.mjs
 * ★ログインの選択肢が「実際に画面に見えているか」を実測する。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★なぜ要るか（iOS build 524・2026-08-23 却下）
 *   Guideline 4.8:
 *     "The app uses a third-party login service, but does not appear to offer
 *      as an equivalent login option another login service..."
 *
 *   ★Sign in with Apple は**実装済みだった**。落ちた理由は「並んでいない」こと。
 *   実測すると、ClerkSignIn（X と Apple を並べる画面）へ行く経路は1つだけで、
 *   ★他11画面は X へ直行していた。審査員が見たメニューもその1つ。
 *
 *   ＝ ★コードに存在するかではなく、**画面に見えているか**が問われる。
 *   だから「実装したか」ではなく「見えたか」を測る。
 *
 * ■ 測り方（kimitolink-linktree/scripts/check-native-visible.mjs から輸入）
 *   1. ★ルートごとに新しい context。使い回すと前ページのDOMを読む瞬間がある
 *   2. ★連続サンプリング（100ms×30回）。「N秒待って1回見る」は
 *      短ければ過渡状態を拾い、長ければ一瞬の露出を見逃す
 *   3. ★スクロールしてから測る。畳まれた領域に隠れていたら「見えている」とは言わない
 *   4. ★goto の失敗を握り潰さない。「文言が無い」ではなく「測れていない」
 *
 * ■ ★判定の向きが輸入元と逆
 *   linktree は「**あってはいけない語**が見えたら赤」（IAP導線の残り）。
 *   こちらは「**あるべき選択肢**が見えなければ赤」。
 *   ★どちらも「0件で緑」になる穴を持つので、測れなかったら exit 2 にする。
 *
 * ■ ★この検査が判定しないこと
 *   ・押した先が正しく動くかは見ない（見えているかだけ）
 *   ・ネイティブアプリ実機の見え方は見ない（Web を Capacitor 相当で開くだけ）
 *   ・文言の良し悪しは見ない
 *
 * 使い方:
 *   node scripts/qa/check-login-options-visible.mjs [https://surechigai.kimito.link]
 *   node scripts/qa/check-login-options-visible.mjs --selftest
 * ───────────────────────────────────────────────────────────────────────────
 */
import { EXIT, computeExitCode, formatProbeReport } from "../lib/instrument-core.mjs";

const BASE = (process.argv[2] || "https://surechigai.kimito.link").replace(/\/+$/, "");

/** ★4.8 で要求される「同等の選択肢」。Apple が無ければ落ちる。 */
const REQUIRED = [
  { key: "apple", label: "Apple", re: /Apple/i },
  { key: "x", re: /X\s*[／/]?\s*Twitter|Xで続ける|X（旧 Twitter）/i, label: "X" },
];

/** ログインの選択肢が出るべき画面。★増やしたらここに足す（足し忘れが穴になる）。 */
const ROUTES = ["/sign-in"];

/* ── selftest: 判定ロジックが毒で赤くなるか ───────────────────── */
export function judge(seenKeys) {
  const missing = REQUIRED.filter((p) => !seenKeys.includes(p.key));
  return { ok: missing.length === 0, missing: missing.map((m) => m.label) };
}

if (process.argv.includes("--selftest")) {
  const cases = [
    { name: "両方見えれば合格", run: () => judge(["apple", "x"]).ok === true },
    { name: "★Apple が無ければ赤（524 の状態）", run: () => judge(["x"]).ok === false },
    { name: "★何も見えなければ赤", run: () => judge([]).ok === false },
    { name: "足りない側を名指しする", run: () => judge(["x"]).missing.join() === "Apple" },
  ];
  const fails = [];
  for (const c of cases) {
    let ok = false;
    try { ok = c.run() === true; } catch (e) { fails.push(`${c.name}: 例外 ${e.message}`); continue; }
    if (!ok) fails.push(`${c.name}: ★期待どおりに動かなかった`);
  }
  if (fails.length) {
    console.error("[check-login-options-visible --selftest] 🔴 検査自体が壊れています:");
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(EXIT.FAIL);
  }
  console.log(`[check-login-options-visible --selftest] ✅ ${cases.length}件すべて期待どおり。`);
  process.exit(EXIT.PASS);
}

/* ── 本体 ─────────────────────────────────────────────────── */
const { chromium } = await import("playwright");
const results = [];
const browser = await chromium.launch();

for (const route of ROUTES) {
  // ★ルートごとに新しい context（使い回すと前ページのDOMを読む瞬間がある）
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // ★ネイティブ相当で開く。Web だけ通ってネイティブで落ちる型を拾うため。
  await ctx.addInitScript(() => {
    // @ts-ignore
    window.Capacitor = { isNativePlatform: () => true };
  });
  const page = await ctx.newPage();

  let navError = null;
  try {
    await page.goto(BASE + route, { waitUntil: "commit", timeout: 45000 });
  } catch (err) {
    // ★握り潰さない。goto の失敗は「見えない」ではなく「測れていない」。
    navError = err?.message ?? String(err);
  }

  // ★連続サンプリング（100ms×30）。1回だけ見ると過渡状態を拾う／見逃す。
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    try {
      const txt = await page.evaluate(() => document.body?.innerText || "");
      for (const p of REQUIRED) if (p.re.test(txt)) seen.add(p.key);
    } catch { /* 遷移中は evaluate が落ちる。次のサンプルへ */ }
    await page.waitForTimeout(100);
  }

  // ★畳まれた領域に隠れていないか、下まで送ってから測り直す
  try {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
    });
    const txt = await page.evaluate(() => document.body?.innerText || "");
    for (const p of REQUIRED) if (p.re.test(txt)) seen.add(p.key);
  } catch { /* ignore */ }

  await ctx.close();

  const keys = [...seen];
  if (navError && keys.length === 0) {
    results.push({
      probe: `ログインの選択肢 ${route}`,
      verdict: "inconclusive",
      evidence: null,
      detail: `ページを開けませんでした: ${navError.slice(0, 80)}`,
      howToFix: "URL と本番の稼働を確認する",
    });
    continue;
  }

  const { ok, missing } = judge(keys);
  results.push(
    ok
      ? {
          probe: `ログインの選択肢 ${route}`,
          verdict: "pass",
          evidence: { 見えた: keys.join(" / "), verifiedAt: new Date().toISOString() },
          limitation: "押した先の動作・実機の見え方は判定しません",
        }
      : {
          probe: `ログインの選択肢 ${route}`,
          verdict: "fail",
          evidence: { 見えた: keys.join(" / ") || "(なし)" },
          detail: `★同じ画面に見えていない選択肢: ${missing.join(", ")}（Guideline 4.8）`,
          howToFix:
            "その画面から /sign-in（X と Apple が並ぶ画面）へ送る。" +
            "auto=x は付けない（着地後に X が自動クリックされ、Apple を選べない）",
          limitation: "押した先の動作・実機の見え方は判定しません",
        },
  );
}

await browser.close();
console.log(formatProbeReport(results, { label: "check-login-options-visible" }));
process.exit(computeExitCode(results));
