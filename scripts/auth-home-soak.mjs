/**
 * auth-home-soak.mjs — 認証済みホームの無人異常検出ハーネス（v2）
 *
 * v1 (docs/auth-home-oom-diagnosis-v2.md Phase 3) は OOM 専用だった。
 * v2 は「ちかちか」「使い物にならない」系の症状も機械検出できるよう、
 * 症状非依存の検出器を追加した（docs/qa-toolkit-design.md 参照）:
 *
 *   - page.on("crash")            … タブ OOM クラッシュ（決定打）            → OOM_CRASH
 *   - page.on("load") 回数        … 意図しないフルリロードの繰り返し          → RELOAD_LOOP
 *     （SW の古いキャッシュ × chunk-recover の自動リロードで起きる「ちかちか」）
 *   - MutationObserver            … childList 変異ノード数/秒。マウント/アンマウントの
 *     暴走（再レンダリングループ・remount ループ）を検出                     → MUTATION_STORM
 *   - console.error("[RadarStageBoundary]") 回数 … ErrorBoundary が繰り返し落ちる → BOUNDARY_LOOP
 *   - console error + pageerror レート                                        → ERROR_STORM
 *   - CDP Performance.getMetrics  … JSHeapUsedSize / Nodes                    → HEAP_GROWTH
 *   - CDP Page.startScreencast    … ペイントフレーム/秒（参考値。アニメ常動画面なので
 *     verdict には使わず、--lite ベースラインとの比較用に記録のみ）
 *   - PerformanceObserver longtask … フリーズ傾向の参考値（記録のみ）
 *   - Service Worker の状態（controller / waiting）を開始時に記録
 *
 * 使い方（詳細は docs/auth-home-soak-HOWTO.md）:
 *   pnpm soak:auth-home                     # 既定: 本番URL・3分・CPU 4x
 *   pnpm soak:auth-home --minutes=10        # 10分ソーク
 *   pnpm soak:auth-home --lite              # ?romiLiteHome=1 でベースライン計測
 *   pnpm soak:auth-home --heap-mb=256       # ヒープ上限を絞って再現を加速
 *   pnpm soak:auth-home --allow-guest       # 認証状態が空でもゲストとして計測
 *   pnpm soak:auth-home --headed            # ブラウザを表示してデバッグ
 *   pnpm soak:auth-home --base-url=http://localhost:8081
 *
 * 前提: .auth/auth-state.json が存在し **空でない** こと（空なら手順を表示して終了。
 *       v1 は空のままゲスト画面を黙って計測してしまう穴があった）。
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
const LITE = hasFlag("lite") || process.env.SOAK_LITE === "1";
const ALLOW_GUEST = hasFlag("allow-guest") || process.env.SOAK_ALLOW_GUEST === "1";
const ACTION_INTERVAL_SEC = 45; // 軽い操作（タブ切替/スクロール）の間隔

const AUTH_STATE_PATH = path.join(ROOT, ".auth", "auth-state.json");

// ---------- 判定しきい値（qa-toolkit-design.md §5-2） ----------
const RELOAD_LOOP_MIN = 3; // 意図しない load がこれ以上 → RELOAD_LOOP
const BOUNDARY_LOOP_MIN = 2; // RadarStageBoundary の捕捉がこれ以上 → BOUNDARY_LOOP
const MUTATION_NODES_PER_SEC = 500; // childList 変異ノード/秒 がこれ以上のサンプルが…
const MUTATION_CONSECUTIVE = 3; // …これだけ連続 → MUTATION_STORM
const ERROR_PER_MIN = 20; // console error + pageerror がこのレート以上 → ERROR_STORM

// ---------- 認証状態チェック ----------
function authStateStatus() {
  if (!fs.existsSync(AUTH_STATE_PATH)) return "missing";
  try {
    const st = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf8"));
    const empty =
      (!Array.isArray(st.cookies) || st.cookies.length === 0) &&
      (!Array.isArray(st.origins) || st.origins.length === 0);
    return empty ? "empty" : "ok";
  } catch {
    return "invalid";
  }
}

const authStatus = authStateStatus();
if (authStatus !== "ok" && !ALLOW_GUEST) {
  console.error(`
[soak] 認証状態が使えません（状態: ${authStatus}）: ${AUTH_STATE_PATH}

- missing … ファイルがない
- empty   … ファイルはあるが cookies/origins が空 = ログインが保存されていない
            （X ログインを完了させる前にブラウザを閉じた等。v1 はこのまま
            ゲスト画面を黙って計測してしまっていた）
- invalid … JSON として読めない

最初に **1回だけ** 手動で X ログインして認証状態を保存してください:

  (Git Bash)
  export PLAYWRIGHT_BASE_URL=${BASE_URL}
  pnpm e2e:auth-save

ブラウザが開くので X ログインを最後まで完了させると .auth/auth-state.json に
保存されます。以後このスクリプトは人手なしで実行できます。
ゲスト状態のまま計測したい場合のみ --allow-guest を付けてください。
`);
  process.exit(2);
}
if (authStatus !== "ok" && ALLOW_GUEST) {
  console.warn(`[soak] 認証状態=${authStatus} のため **ゲストとして** 計測します（--allow-guest）`);
}

// ---------- 出力先 ----------
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT_DIR = path.join(ROOT, "soak-results", stamp + (LITE ? "-lite" : ""));
fs.mkdirSync(OUT_DIR, { recursive: true });
const CSV_PATH = path.join(OUT_DIR, "metrics.csv");
fs.writeFileSync(
  CSV_PATH,
  "elapsedSec,jsHeapUsedMB,jsHeapTotalMB,nodes,jsEventListeners,documents,frames,paintFps,mutNodesPerSec,longTaskMs,consoleErrors\n",
);

const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

// ---------- 本体 ----------
const samples = [];
let crashed = false;
let crashAtSec = null;
const pageErrors = [];
const consoleErrors = []; // { atSec, text }
let radarBoundaryTrips = 0;
let loadCount = 0;
const reloadTimesSec = []; // 2回目以降の load（= 意図しないフルリロード）
let paintFrames = 0;
let paintFramesSupported = false;
let swInfo = null;
let startedAt = Date.now();
const elapsedSec = () => Math.round((Date.now() - startedAt) / 1000);

async function main() {
  const targetUrl = BASE_URL + "/" + (LITE ? "?romiLiteHome=1" : "");
  console.log(`[soak] 対象: ${targetUrl}`);
  console.log(
    `[soak] 条件: ${MINUTES}分 / サンプル${SAMPLE_SEC}秒毎 / CPU ${CPU_RATE}x / viewport Pixel5(393x851)` +
      (HEAP_MB ? ` / ヒープ上限 ${HEAP_MB}MB` : "") +
      (NO_TABS ? " / タブ切替なし" : "") +
      (LITE ? " / liteモード(ベースライン)" : ""),
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
    storageState: authStatus === "ok" ? AUTH_STATE_PATH : undefined,
    extraHTTPHeaders,
  });

  // ページ内プローブ（リロードのたびに再注入される）:
  //   - MutationObserver: childList 変異ノード数（remount/再レンダ暴走の指標）
  //   - PerformanceObserver longtask: フリーズ傾向の指標
  //   - docId: リロード検知（値が変わったらドキュメントが差し替わった）
  await context.addInitScript(() => {
    const probe = {
      docId: Math.random().toString(36).slice(2),
      mutAdded: 0,
      mutRemoved: 0,
      longTasks: 0,
      longTaskMs: 0,
    };
    // @ts-ignore
    window.__romiProbe = probe;
    try {
      const mo = new MutationObserver((records) => {
        for (const r of records) {
          probe.mutAdded += r.addedNodes.length;
          probe.mutRemoved += r.removedNodes.length;
        }
      });
      const start = () => {
        try {
          mo.observe(document.documentElement || document, {
            childList: true,
            subtree: true,
          });
        } catch {}
      };
      if (document.documentElement) start();
      else document.addEventListener("DOMContentLoaded", start, { once: true });
    } catch {}
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          probe.longTasks++;
          probe.longTaskMs += e.duration;
        }
      });
      po.observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  const page = await context.newPage();

  page.on("crash", () => {
    crashed = true;
    crashAtSec = elapsedSec();
    console.error(`[soak] !!!! page CRASH detected at +${crashAtSec}s (OOM の可能性大)`);
  });
  page.on("pageerror", (err) => {
    pageErrors.push({ atSec: elapsedSec(), message: String(err).slice(0, 300) });
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("[RadarStageBoundary]")) {
      radarBoundaryTrips++;
      console.warn(`[soak] RadarStageBoundary が捕捉 (+${elapsedSec()}s, 累計${radarBoundaryTrips}回)`);
    }
    consoleErrors.push({ atSec: elapsedSec(), text: text.slice(0, 200) });
  });
  // SPA 遷移では load は発火しない。2回目以降の load = フルリロード
  //（SW キャッシュずれ × chunk-recover 自動リロート等の「ちかちか」を捕まえる）
  page.on("load", () => {
    loadCount++;
    if (loadCount > 1) {
      reloadTimesSec.push(elapsedSec());
      console.warn(`[soak] 意図しないフルリロード検出 (+${elapsedSec()}s, 累計${reloadTimesSec.length}回)`);
    }
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });

  // ペイントフレーム計測（screencast はペイント時のみフレームを送る）。
  // 低解像度 JPEG なので計測負荷は小さい。失敗しても計測全体は続行。
  try {
    cdp.on("Page.screencastFrame", (ev) => {
      paintFrames++;
      cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 20,
      maxWidth: 240,
      maxHeight: 480,
      everyNthFrame: 1,
    });
    paintFramesSupported = true;
  } catch (err) {
    console.warn(`[soak] screencast 開始に失敗（paintFps は記録されません）: ${String(err).slice(0, 120)}`);
  }

  startedAt = Date.now();

  // --- ホームへ ---
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(8_000); // 初期レンダ・クエリの落ち着き待ち

  // 認証状態のヒント確認（clerk キーが localStorage にあるか）
  const hasClerkHint = await page
    .evaluate(() => Object.keys(localStorage).some((k) => k.toLowerCase().includes("clerk")))
    .catch(() => false);
  if (!hasClerkHint && !ALLOW_GUEST) {
    console.warn(
      "[soak] 警告: localStorage に clerk キーが見当たりません。セッション失効の可能性があります。\n" +
        "        スクリーンショット (00-start.png) でログイン済み画面か確認し、ゲスト画面なら\n" +
        "        pnpm e2e:auth-save で認証状態を再保存してください。計測は続行します。",
    );
  }

  // Service Worker の状態を記録（リロードループの容疑者調査用）
  swInfo = await page
    .evaluate(async () => {
      if (!("serviceWorker" in navigator)) return { supported: false };
      const reg = await navigator.serviceWorker.getRegistration();
      return {
        supported: true,
        controller: navigator.serviceWorker.controller?.scriptURL ?? null,
        active: reg?.active?.scriptURL ?? null,
        waiting: Boolean(reg?.waiting),
      };
    })
    .catch(() => null);

  await page.screenshot({ path: path.join(OUT_DIR, "00-start.png") }).catch(() => {});

  // --- サンプリング関数 ---
  let prevProbe = { docId: null, mutTotal: 0, longTaskMs: 0 };
  let prevPaintFrames = 0;
  let prevConsoleErrors = 0;
  let prevElapsed = 0;

  async function sample() {
    const { metrics } = await cdp.send("Performance.getMetrics");
    const get = (name) => metrics.find((m) => m.name === name)?.value ?? 0;

    const probe = await page
      .evaluate(() => /** @type {any} */ (window).__romiProbe ?? null)
      .catch(() => null);

    const now = elapsedSec();
    const windowSec = Math.max(1, now - prevElapsed);
    prevElapsed = now;

    let mutNodesPerSec = null;
    let longTaskMsDelta = null;
    if (probe) {
      const mutTotal = probe.mutAdded + probe.mutRemoved;
      if (probe.docId !== prevProbe.docId) {
        // ドキュメントが差し替わった（リロード）→ カウンタはゼロから
        prevProbe = { docId: probe.docId, mutTotal: 0, longTaskMs: 0 };
      }
      mutNodesPerSec = Math.round(Math.max(0, mutTotal - prevProbe.mutTotal) / windowSec);
      longTaskMsDelta = Math.round(Math.max(0, probe.longTaskMs - prevProbe.longTaskMs));
      prevProbe = { docId: probe.docId, mutTotal, longTaskMs: probe.longTaskMs };
    }

    let paintFps = null;
    if (paintFramesSupported) {
      paintFps = Math.round(((paintFrames - prevPaintFrames) / windowSec) * 10) / 10;
      prevPaintFrames = paintFrames;
    }

    const errTotal = consoleErrors.length + pageErrors.length;
    const errDelta = errTotal - prevConsoleErrors;
    prevConsoleErrors = errTotal;

    const row = {
      elapsedSec: now,
      jsHeapUsedMB: toMB(get("JSHeapUsedSize")),
      jsHeapTotalMB: toMB(get("JSHeapTotalSize")),
      nodes: get("Nodes"),
      jsEventListeners: get("JSEventListeners"),
      documents: get("Documents"),
      frames: get("Frames"),
      paintFps,
      mutNodesPerSec,
      longTaskMs: longTaskMsDelta,
      consoleErrors: errDelta,
    };
    samples.push(row);
    fs.appendFileSync(
      CSV_PATH,
      `${row.elapsedSec},${row.jsHeapUsedMB},${row.jsHeapTotalMB},${row.nodes},${row.jsEventListeners},${row.documents},${row.frames},${row.paintFps ?? ""},${row.mutNodesPerSec ?? ""},${row.longTaskMs ?? ""},${row.consoleErrors}\n`,
    );
    console.log(
      `[HB] +${row.elapsedSec}s heap=${row.jsHeapUsedMB}MB nodes=${row.nodes} listeners=${row.jsEventListeners}` +
        (row.paintFps != null ? ` paint=${row.paintFps}fps` : "") +
        (row.mutNodesPerSec != null ? ` mut=${row.mutNodesPerSec}/s` : "") +
        (row.consoleErrors ? ` err=+${row.consoleErrors}` : ""),
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

  const heapDeltaMB =
    first && last ? Math.round((last.jsHeapUsedMB - first.jsHeapUsedMB) * 100) / 100 : 0;
  const nodesDelta = first && last ? last.nodes - first.nodes : 0;

  // mutation storm: しきい値超えの最大連続サンプル数
  let mutMaxStreak = 0;
  let streak = 0;
  let mutMaxPerSec = 0;
  for (const s of samples) {
    const v = s.mutNodesPerSec ?? 0;
    mutMaxPerSec = Math.max(mutMaxPerSec, v);
    if (v >= MUTATION_NODES_PER_SEC) {
      streak++;
      mutMaxStreak = Math.max(mutMaxStreak, streak);
    } else {
      streak = 0;
    }
  }

  const totalErrors = consoleErrors.length + pageErrors.length;
  const elapsedMin = Math.max(1 / 60, (last?.elapsedSec ?? 1) / 60);
  const errorPerMin = Math.round((totalErrors / elapsedMin) * 10) / 10;

  const paintSamples = samples.filter((s) => s.paintFps != null);
  const paintAvgFps = paintSamples.length
    ? Math.round(
        (paintSamples.reduce((a, s) => a + s.paintFps, 0) / paintSamples.length) * 10,
      ) / 10
    : null;
  const paintMaxFps = paintSamples.length
    ? Math.max(...paintSamples.map((s) => s.paintFps))
    : null;
  const longTaskTotalMs = samples.reduce((a, s) => a + (s.longTaskMs ?? 0), 0);

  // 判定（優先順位: クラッシュ > リロードループ > remountループ > 変異暴走 > エラー多発 > ヒープ増加）
  let verdict = "OK";
  if (crashed) verdict = "OOM_CRASH";
  else if (reloadTimesSec.length >= RELOAD_LOOP_MIN) verdict = "RELOAD_LOOP";
  else if (radarBoundaryTrips >= BOUNDARY_LOOP_MIN) verdict = "BOUNDARY_LOOP";
  else if (mutMaxStreak >= MUTATION_CONSECUTIVE) verdict = "MUTATION_STORM";
  else if (errorPerMin >= ERROR_PER_MIN) verdict = "ERROR_STORM";
  else if (slopeMBPerMin > 1 && heapDeltaMB > 10) verdict = "HEAP_GROWTH";

  const summary = {
    baseUrl: BASE_URL,
    liteMode: LITE,
    authState: authStatus,
    minutes: MINUTES,
    cpuThrottlingRate: CPU_RATE,
    heapLimitMB: HEAP_MB || null,
    tabSwitching: !NO_TABS,
    serviceWorker: swInfo,
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
    unexpectedReloads: reloadTimesSec.length,
    reloadTimesSec,
    radarBoundaryTrips,
    mutationMaxNodesPerSec: mutMaxPerSec,
    mutationMaxStreak: mutMaxStreak,
    paintAvgFps,
    paintMaxFps,
    longTaskTotalMs,
    consoleErrorCount: consoleErrors.length,
    consoleErrorsFirst20: consoleErrors.slice(0, 20),
    pageErrorCount: pageErrors.length,
    pageErrors: pageErrors.slice(0, 20),
    errorPerMin,
    verdict,
    outDir: OUT_DIR,
  };
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n===== ソーク結果 =====");
  console.log(`判定: ${verdict}` + (LITE ? "（liteモード＝ベースライン）" : ""));
  if (crashed) console.log(`クラッシュ: +${crashAtSec}s で page crash（OOM の可能性大）`);
  if (reloadTimesSec.length)
    console.log(`意図しないリロード: ${reloadTimesSec.length}回 (at ${reloadTimesSec.join(", ")}s)`);
  if (radarBoundaryTrips) console.log(`RadarStageBoundary 捕捉: ${radarBoundaryTrips}回`);
  console.log(
    `ヒープ: 初期 ${summary.initialHeapMB}MB → 最終 ${summary.finalHeapMB}MB (Δ${heapDeltaMB}MB, ${slopeMBPerMin}MB/分, 最大 ${maxHeap}MB)`,
  );
  console.log(`DOMノード: ${summary.initialNodes} → ${summary.finalNodes} (Δ${nodesDelta})`);
  console.log(
    `変異: 最大 ${mutMaxPerSec}ノード/秒 (しきい値${MUTATION_NODES_PER_SEC}超の連続 ${mutMaxStreak}サンプル)`,
  );
  if (paintAvgFps != null)
    console.log(`ペイント: 平均 ${paintAvgFps}fps / 最大 ${paintMaxFps}fps（--lite と比較して読む参考値）`);
  console.log(`long task: 合計 ${Math.round(longTaskTotalMs)}ms`);
  console.log(`エラー: console ${consoleErrors.length}件 + pageerror ${pageErrors.length}件 (${errorPerMin}/分)`);
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
