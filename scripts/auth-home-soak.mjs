/**
 * auth-home-soak.mjs — 認証済みホームの OOM ソークテスト
 *
 * docs/auth-home-oom-diagnosis-v2.md Phase 3 の実装。
 * 保存済み認証状態（.auth/auth-state.json）を使い、モバイル相当の条件で
 * 認証済みホーム（ポストタブ）に一定時間滞在し、以下を機械計測する:
 *
 *   - page.on("crash")            … タブ OOM クラッシュの機械検出（決定打）
 *   - CDP Performance.getMetrics  … JSHeapUsedSize / Nodes 等を定期サンプリング → CSV
 *   - CDP Emulation.setCPUThrottlingRate … 低スペック端末の近似（既定 4x）
 *   - タブ切替 + スクロールの軽い操作シミュレート
 *
 * 使い方（詳細は docs/auth-home-soak-HOWTO.md）:
 *   pnpm soak:auth-home                     # 既定: 本番URL・3分・CPU 4x
 *   pnpm soak:auth-home --minutes=10        # 10分ソーク
 *   pnpm soak:auth-home --heap-mb=256       # ヒープ上限を絞って再現を加速
 *   pnpm soak:auth-home --headed            # ブラウザを表示してデバッグ
 *   pnpm soak:auth-home --base-url=http://localhost:8081
 *
 * 前提: .auth/auth-state.json が存在すること（無ければ手順を表示して終了する）。
 * 出力: soak-results/<timestamp>/ に metrics.csv / summary.json / スクリーンショット。
 */

import { chromium, devices } from "playwright";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

// ---------- 引数 ----------
function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  return fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const BASE_URL =
  arg("base-url", null) ??
  process.env.SOAK_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://surechigai.kimito.link";
const MINUTES = Number(arg("minutes", process.env.SOAK_MINUTES ?? "3"));
const SAMPLE_SEC = Number(arg("sample-sec", process.env.SOAK_SAMPLE_SEC ?? "10"));
const CPU_RATE = Number(arg("cpu-rate", process.env.SOAK_CPU_RATE ?? "4"));
const HEAP_MB = arg("heap-mb", process.env.SOAK_HEAP_MB ?? "");
const HEADED = hasFlag("headed") || process.env.SOAK_HEADED === "1";
const NO_TABS = hasFlag("no-tabs") || process.env.SOAK_NO_TABS === "1";
const ACTION_INTERVAL_SEC = 45; // 軽い操作（タブ切替/スクロール）の間隔

const AUTH_STATE_PATH = path.join(ROOT, ".auth", "auth-state.json");

// ---------- 認証状態チェック ----------
if (!fs.existsSync(AUTH_STATE_PATH)) {
  console.error(`
[soak] 認証状態ファイルがありません: ${AUTH_STATE_PATH}

このソークテストは保存済みのログインセッションを再利用します。
最初に **1回だけ** 手動で X ログインして認証状態を保存してください:

  (Git Bash)
  export PLAYWRIGHT_BASE_URL=${BASE_URL}
  pnpm e2e:auth-save

ブラウザが開くので X ログインを完了させると .auth/auth-state.json に保存されます。
以後このスクリプトは人手なしで実行できます（セッション失効時は同じ手順で再保存）。
`);
  process.exit(2);
}

// ---------- 出力先 ----------
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT_DIR = path.join(ROOT, "soak-results", stamp);
fs.mkdirSync(OUT_DIR, { recursive: true });
const CSV_PATH = path.join(OUT_DIR, "metrics.csv");
fs.writeFileSync(
  CSV_PATH,
  "elapsedSec,jsHeapUsedMB,jsHeapTotalMB,nodes,jsEventListeners,documents,frames\n",
);

const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

// ---------- 本体 ----------
const samples = [];
let crashed = false;
let crashAtSec = null;
const pageErrors = [];

async function main() {
  console.log(`[soak] 対象: ${BASE_URL}`);
  console.log(
    `[soak] 条件: ${MINUTES}分 / サンプル${SAMPLE_SEC}秒毎 / CPU ${CPU_RATE}x / viewport Pixel5(393x851)` +
      (HEAP_MB ? ` / ヒープ上限 ${HEAP_MB}MB` : "") +
      (NO_TABS ? " / タブ切替なし" : ""),
  );
  console.log(`[soak] 出力: ${OUT_DIR}`);

  const launchArgs = [];
  if (HEAP_MB) launchArgs.push(`--js-flags=--max-old-space-size=${HEAP_MB}`);

  const browser = await chromium.launch({ headless: !HEADED, args: launchArgs });

  const extraHTTPHeaders = {};
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    extraHTTPHeaders["x-vercel-protection-bypass"] =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  }

  const context = await browser.newContext({
    ...devices["Pixel 5"], // 393x851, DPR2.75, mobile UA, touch
    storageState: AUTH_STATE_PATH,
    extraHTTPHeaders,
  });
  const page = await context.newPage();

  page.on("crash", () => {
    crashed = true;
    crashAtSec = Math.round((Date.now() - startedAt) / 1000);
    console.error(`[soak] !!!! page CRASH detected at +${crashAtSec}s (OOM の可能性大)`);
  });
  page.on("pageerror", (err) => {
    pageErrors.push({ atSec: Math.round((Date.now() - startedAt) / 1000), message: String(err) });
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });

  const startedAt = Date.now();

  // --- ホームへ ---
  await page.goto(BASE_URL + "/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(8_000); // 初期レンダ・クエリの落ち着き待ち

  // 認証状態のヒント確認（clerk キーが localStorage にあるか）
  const hasClerkHint = await page
    .evaluate(() => Object.keys(localStorage).some((k) => k.toLowerCase().includes("clerk")))
    .catch(() => false);
  if (!hasClerkHint) {
    console.warn(
      "[soak] 警告: localStorage に clerk キーが見当たりません。セッション失効の可能性があります。\n" +
        "        スクリーンショット (00-start.png) でログイン済み画面か確認し、ゲスト画面なら\n" +
        "        pnpm e2e:auth-save で認証状態を再保存してください。計測は続行します。",
    );
  }
  await page.screenshot({ path: path.join(OUT_DIR, "00-start.png") }).catch(() => {});

  // --- サンプリング関数 ---
  async function sample() {
    const { metrics } = await cdp.send("Performance.getMetrics");
    const get = (name) => metrics.find((m) => m.name === name)?.value ?? 0;
    const row = {
      elapsedSec: Math.round((Date.now() - startedAt) / 1000),
      jsHeapUsedMB: toMB(get("JSHeapUsedSize")),
      jsHeapTotalMB: toMB(get("JSHeapTotalSize")),
      nodes: get("Nodes"),
      jsEventListeners: get("JSEventListeners"),
      documents: get("Documents"),
      frames: get("Frames"),
    };
    samples.push(row);
    fs.appendFileSync(
      CSV_PATH,
      `${row.elapsedSec},${row.jsHeapUsedMB},${row.jsHeapTotalMB},${row.nodes},${row.jsEventListeners},${row.documents},${row.frames}\n`,
    );
    console.log(
      `[HB] +${row.elapsedSec}s heap=${row.jsHeapUsedMB}MB nodes=${row.nodes} listeners=${row.jsEventListeners}`,
    );
  }

  // --- 軽い操作（タブ切替 + スクロール） ---
  const TAB_CYCLE = ["/checkin", "/zukan", "/"]; // 最後にホームへ戻る
  async function lightInteraction() {
    if (NO_TABS) {
      await page.mouse.wheel(0, 400).catch(() => {});
      await page.waitForTimeout(1_000);
      await page.mouse.wheel(0, -400).catch(() => {});
      return;
    }
    for (const href of TAB_CYCLE) {
      const link = page.locator(`a[href="${href}"]`).first();
      try {
        await link.click({ timeout: 5_000 });
        await page.waitForTimeout(2_500);
      } catch {
        console.warn(`[soak] タブ ${href} のクリックに失敗（スキップ）`);
      }
      if (crashed) return;
    }
    // ホームに戻れていなければ SPA の history.back で復帰を試みる
    // （page.goto はフルリロード＝メモリ計測がリセットされるので使わない）
    for (let i = 0; i < 3 && !crashed; i++) {
      const pathname = await page.evaluate(() => location.pathname).catch(() => "/");
      if (pathname === "/") break;
      await page.evaluate(() => history.back()).catch(() => {});
      await page.waitForTimeout(2_000);
    }
    await page.mouse.wheel(0, 300).catch(() => {});
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, -300).catch(() => {});
  }

  // --- ソークループ ---
  const endAt = startedAt + MINUTES * 60_000;
  let nextSampleAt = startedAt;
  let nextActionAt = startedAt + ACTION_INTERVAL_SEC * 1_000;

  await sample().catch(() => {});
  nextSampleAt = Date.now() + SAMPLE_SEC * 1_000;

  while (Date.now() < endAt && !crashed) {
    await new Promise((r) => setTimeout(r, 1_000));
    if (crashed) break;
    try {
      if (Date.now() >= nextSampleAt) {
        await sample();
        nextSampleAt = Date.now() + SAMPLE_SEC * 1_000;
      }
      if (Date.now() >= nextActionAt) {
        await lightInteraction();
        nextActionAt = Date.now() + ACTION_INTERVAL_SEC * 1_000;
      }
    } catch (err) {
      if (crashed) break;
      console.warn(`[soak] ループ中のエラー（続行）: ${String(err).slice(0, 200)}`);
    }
  }

  if (!crashed) {
    await page.screenshot({ path: path.join(OUT_DIR, "99-end.png") }).catch(() => {});
  }
  await browser.close().catch(() => {});
  return summarize();
}

// ---------- 集計 ----------
function summarize() {
  const first = samples[0];
  const last = samples[samples.length - 1];
  const maxHeap = Math.max(...samples.map((s) => s.jsHeapUsedMB), 0);

  // 単調増加の目安: 経過時間 vs ヒープの線形回帰スロープ（MB/分）
  let slopeMBPerMin = 0;
  if (samples.length >= 3) {
    const n = samples.length;
    const xs = samples.map((s) => s.elapsedSec / 60);
    const ys = samples.map((s) => s.jsHeapUsedMB);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
    const den = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0);
    slopeMBPerMin = den === 0 ? 0 : Math.round((num / den) * 100) / 100;
  }

  const heapDeltaMB = first && last ? Math.round((last.jsHeapUsedMB - first.jsHeapUsedMB) * 100) / 100 : 0;
  const nodesDelta = first && last ? last.nodes - first.nodes : 0;

  let verdict = "OK";
  if (crashed) verdict = "OOM_CRASH";
  else if (slopeMBPerMin > 1 && heapDeltaMB > 10) verdict = "HEAP_GROWTH";

  const summary = {
    baseUrl: BASE_URL,
    minutes: MINUTES,
    cpuThrottlingRate: CPU_RATE,
    heapLimitMB: HEAP_MB || null,
    tabSwitching: !NO_TABS,
    crashed,
    crashAtSec,
    sampleCount: samples.length,
    initialHeapMB: first?.jsHeapUsedMB ?? null,
    finalHeapMB: last?.jsHeapUsedMB ?? null,
    maxHeapMB: maxHeap,
    heapDeltaMB,
    slopeMBPerMin,
    initialNodes: first?.nodes ?? null,
    finalNodes: last?.nodes ?? null,
    nodesDelta,
    pageErrorCount: pageErrors.length,
    pageErrors: pageErrors.slice(0, 20),
    verdict,
    outDir: OUT_DIR,
  };
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n===== ソーク結果 =====");
  console.log(`判定: ${verdict}`);
  if (crashed) console.log(`クラッシュ: +${crashAtSec}s で page crash（OOM の可能性大）`);
  console.log(
    `ヒープ: 初期 ${summary.initialHeapMB}MB → 最終 ${summary.finalHeapMB}MB (Δ${heapDeltaMB}MB, ${slopeMBPerMin}MB/分, 最大 ${maxHeap}MB)`,
  );
  console.log(`DOMノード: ${summary.initialNodes} → ${summary.finalNodes} (Δ${nodesDelta})`);
  console.log(`pageerror: ${pageErrors.length}件`);
  console.log(`詳細: ${path.join(OUT_DIR, "metrics.csv")} / summary.json`);
  console.log("=====================\n");

  return crashed ? 1 : 0;
}

process.on("SIGINT", () => {
  console.log("\n[soak] 中断されました。ここまでの結果を集計します。");
  summarize();
  process.exit(130);
});

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[soak] 実行エラー: ${err?.stack ?? err}`);
    try {
      summarize();
    } catch {}
    process.exit(1);
  });
