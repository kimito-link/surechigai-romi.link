/**
 * first-load-crash.mjs — 初回アクセス〜OOM/白画面の再現・記録プローブ
 *
 * docs/qa-toolkit-design.md §3 の実装。
 * ユーザー報告の症状「アクセス→かなり重い→一瞬見える→白くなる→out of memory で真っ暗」
 * （= 初回マウントの急性クラッシュ）を捕まえることに特化する。
 *
 * 既存の auth-home-soak.mjs との違い:
 *   - 「8秒待ってから計測」ではなく goto の瞬間から 500ms 間隔で全記録
 *   - タイムラインログ (events.ndjson) は即時フラッシュ → クラッシュしてもデータが残る
 *   - 白画面ステートマシン (NONE→CONTENT→BLANK) で「一瞬見えた後白くなる」を機械検出
 *   - DOMContentLoaded / FCP / longtask / tRPC発火 のタイミングを記録
 *   - タブ切替などの操作は一切しない（初回マウントの純粋観測）
 *
 * 使い方:
 *   pnpm qa:first-load                       # 既定: 本番URL・3回反復・CPU 4x・90秒窓
 *   pnpm qa:first-load --iterations=5 --cpu-rate=6
 *   pnpm qa:first-load --heap-mb=512         # ヒープ上限を絞って再現加速
 *   pnpm qa:first-load --headed
 *   pnpm qa:first-load --base-url=http://localhost:8081
 *   pnpm qa:first-load --allow-guest         # 認証状態が空/無しでもゲストとして計測
 *
 * 前提: .auth/auth-state.json が存在し **空でない** こと（無ければ pnpm e2e:auth-save で保存。
 *       空 = ログイン未完了保存。その場合はエラーで止まる）。
 * 出力: qa-results/first-load/<timestamp>/iter-N/ に events.ndjson / metrics.csv / shots/ / summary.json
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
  process.env.QA_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://surechigai.kimito.link";
const TARGET_PATH = arg("path", "/");
const ITERATIONS = Number(arg("iterations", "3"));
const WINDOW_SEC = Number(arg("window-sec", "90"));
const SAMPLE_MS = Number(arg("sample-ms", "500"));
const CPU_RATE = Number(arg("cpu-rate", "4"));
const HEAP_MB = arg("heap-mb", "");
const HEADED = hasFlag("headed");
const HEAP_SUSPICIOUS_MB = Number(arg("heap-suspicious-mb", "800"));
const EVAL_TIMEOUT_MS = 1_500; // これを超えて evaluate が返らない = メインスレッド閉塞

const AUTH_STATE_PATH = path.join(ROOT, ".auth", "auth-state.json");

// 認証状態チェック。存在するだけでなく **空でない** ことも見る。
// ログイン未完了でブラウザを閉じると空の storageState（{"cookies":[],"origins":[]}）が
// 保存され、ゲスト画面を黙って計測して偽陰性（OK）を出す事故が実際に起きた（2026-07-04）。
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
const AUTH_STATUS = authStateStatus();
if (AUTH_STATUS !== "ok" && !hasFlag("allow-guest")) {
  console.error(`
[first-load] 認証状態が使えません（状態: ${AUTH_STATUS}）: ${AUTH_STATE_PATH}

- missing … ファイルがない
- empty   … ファイルはあるが cookies/origins が空 = X ログインが最後まで完了していない
- invalid … JSON として読めない

最初に 1回だけ 手動で X ログインして認証状態を保存してください:
  (Git Bash)
  export PLAYWRIGHT_BASE_URL=${BASE_URL}
  pnpm e2e:auth-save

ゲスト状態のまま初回ロードを計測したい場合のみ --allow-guest を付けてください。
`);
  process.exit(2);
}
if (AUTH_STATUS !== "ok") {
  console.warn(`[first-load] 認証状態=${AUTH_STATUS} のため **ゲストとして** 計測します（--allow-guest）`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const RUN_DIR = path.join(ROOT, "qa-results", "first-load", stamp);
fs.mkdirSync(RUN_DIR, { recursive: true });

const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

/** evaluate がメインスレッド閉塞で永久に返らないのを防ぐレース */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("EVAL_TIMEOUT")), ms)),
  ]);
}

// ---------- 1反復 ----------
async function runIteration(iter) {
  const OUT_DIR = path.join(RUN_DIR, `iter-${iter}`);
  const SHOT_DIR = path.join(OUT_DIR, "shots");
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  const NDJSON = path.join(OUT_DIR, "events.ndjson");
  const CSV = path.join(OUT_DIR, "metrics.csv");
  fs.writeFileSync(CSV, "tMs,jsHeapUsedMB,jsHeapTotalMB,nodes,jsEventListeners,documents,frames\n");

  let t0 = Date.now(); // goto 発行時刻で上書きする
  const ev = (type, data = {}) => {
    const line = JSON.stringify({ tMs: Date.now() - t0, type, ...data });
    fs.appendFileSync(NDJSON, line + "\n"); // 即時フラッシュ: クラッシュしてもここまで残る
    return line;
  };

  const state = {
    crashed: false,
    crashAtMs: null,
    contentSeenAtMs: null,
    whiteScreenAtMs: null,
    domContentLoadedAtMs: null,
    fcpAtMs: null,
    lastHeapMB: null,
    maxHeapMB: 0,
    blockedCount: 0,
    pageErrorCount: 0,
    trpcRequests: [],
    contentState: "NONE", // NONE -> CONTENT -> BLANK
  };

  const launchArgs = [];
  if (HEAP_MB) launchArgs.push(`--js-flags=--max-old-space-size=${HEAP_MB}`);
  const browser = await chromium.launch({ headless: !HEADED, args: launchArgs });

  const extraHTTPHeaders = {};
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    extraHTTPHeaders["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  }

  const context = await browser.newContext({
    ...devices["Pixel 5"],
    storageState: AUTH_STATUS === "ok" ? AUTH_STATE_PATH : undefined,
    extraHTTPHeaders,
  });
  const page = await context.newPage();

  // ===== goto より前に全リスナーを登録する（ここが soak との最大の違い） =====

  page.on("crash", () => {
    state.crashed = true;
    state.crashAtMs = Date.now() - t0;
    console.error(
      `[first-load][iter${iter}] !!!! CRASH at +${(state.crashAtMs / 1000).toFixed(1)}s ` +
        `(直前ヒープ ${state.lastHeapMB ?? "?"}MB)`,
    );
    ev("crash", { lastHeapMB: state.lastHeapMB });
  });
  page.on("pageerror", (err) => {
    state.pageErrorCount++;
    ev("pageerror", { message: String(err).slice(0, 500) });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      ev("console", { level: msg.type(), text: msg.text().slice(0, 300) });
    }
  });
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/trpc")) {
      // procedure 名は /api/trpc/<a.b,c.d>?batch=1 形式から抽出
      const m = url.match(/\/api\/trpc\/([^?]+)/);
      const procedures = m ? decodeURIComponent(m[1]) : url;
      state.trpcRequests.push({ tMs: Date.now() - t0, procedures });
      ev("trpc-request", { procedures });
    }
  });
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/trpc")) {
      let sizeKB = null;
      try {
        const body = await res.body();
        sizeKB = Math.round((body.length / 1024) * 10) / 10;
      } catch {}
      ev("trpc-response", { status: res.status(), sizeKB, url: url.slice(0, 200) });
    }
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.setLifecycleEventsEnabled", { enabled: true });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });

  cdp.on("Page.lifecycleEvent", (e) => {
    ev("lifecycle", { name: e.name });
    if (e.name === "DOMContentLoaded" && state.domContentLoadedAtMs == null) {
      state.domContentLoadedAtMs = Date.now() - t0;
    }
    if (e.name === "firstContentfulPaint" && state.fcpAtMs == null) {
      state.fcpAtMs = Date.now() - t0;
    }
  });

  // long task / paint を buffered で拾う PerformanceObserver を注入
  await page.addInitScript(() => {
    window.__qaLongTasks = [];
    window.__qaPaints = [];
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__qaLongTasks.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
      }).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__qaPaints.push({ name: e.name, start: Math.round(e.startTime) });
      }).observe({ type: "paint", buffered: true });
    } catch {}
  });

  // ===== goto（待たない。発行した瞬間から観測開始） =====
  t0 = Date.now();
  ev("goto-issued", { url: BASE_URL + TARGET_PATH, cpuRate: CPU_RATE, heapLimitMB: HEAP_MB || null });
  console.log(
    `[first-load][iter${iter}] goto ${BASE_URL + TARGET_PATH} (CPU ${CPU_RATE}x` +
      (HEAP_MB ? `, heap ${HEAP_MB}MB` : "") +
      `, 窓 ${WINDOW_SEC}s)`,
  );

  const gotoPromise = page
    .goto(BASE_URL + TARGET_PATH, { waitUntil: "domcontentloaded", timeout: WINDOW_SEC * 1000 })
    .then(() => ev("goto-resolved"))
    .catch((err) => ev("goto-error", { message: String(err).slice(0, 300) }));

  // ===== 観測ループ =====
  const endAt = t0 + WINDOW_SEC * 1000;
  let lastShotAt = 0;
  let drainedLongTasks = 0;

  while (Date.now() < endAt && !state.crashed) {
    const tickStart = Date.now();
    const tMs = tickStart - t0;

    // 1) ヒープサンプル（CDP はメインスレッド閉塞でも比較的返る）
    try {
      const { metrics } = await withTimeout(cdp.send("Performance.getMetrics"), EVAL_TIMEOUT_MS);
      const get = (name) => metrics.find((m) => m.name === name)?.value ?? 0;
      const heapMB = toMB(get("JSHeapUsedSize"));
      state.lastHeapMB = heapMB;
      state.maxHeapMB = Math.max(state.maxHeapMB, heapMB);
      fs.appendFileSync(
        CSV,
        `${tMs},${heapMB},${toMB(get("JSHeapTotalSize"))},${get("Nodes")},${get("JSEventListeners")},${get("Documents")},${get("Frames")}\n`,
      );
    } catch {
      ev("metrics-timeout");
    }

    // 2) 白画面ステートマシン（evaluate 閉塞 = MAIN_THREAD_BLOCKED も記録）
    try {
      const probe = await withTimeout(
        page.evaluate(() => {
          const root = document.getElementById("root") ?? document.body;
          const text = (root?.innerText ?? "").trim();
          return {
            textLen: text.length,
            childCount: root?.childElementCount ?? 0,
            longTasks: (window.__qaLongTasks ?? []).slice(),
            paints: (window.__qaPaints ?? []).slice(),
          };
        }),
        EVAL_TIMEOUT_MS,
      );
      // long task の未記録分を回収
      for (const lt of probe.longTasks.slice(drainedLongTasks)) ev("longtask", lt);
      drainedLongTasks = probe.longTasks.length;

      if (state.contentState === "NONE" && probe.textLen > 20) {
        state.contentState = "CONTENT";
        state.contentSeenAtMs = tMs;
        ev("content-seen", { textLen: probe.textLen, childCount: probe.childCount });
        console.log(`[first-load][iter${iter}] +${(tMs / 1000).toFixed(1)}s コンテンツ描画を確認`);
        await page.screenshot({ path: path.join(SHOT_DIR, `t${tMs}-content.png`) }).catch(() => {});
      } else if (state.contentState === "CONTENT" && probe.textLen < 5 && probe.childCount <= 1) {
        state.contentState = "BLANK";
        state.whiteScreenAtMs = tMs;
        ev("white-screen", { textLen: probe.textLen, childCount: probe.childCount });
        console.error(`[first-load][iter${iter}] +${(tMs / 1000).toFixed(1)}s 白画面化を検出`);
        await page.screenshot({ path: path.join(SHOT_DIR, `t${tMs}-blank.png`) }).catch(() => {});
      }
    } catch (err) {
      if (String(err).includes("EVAL_TIMEOUT")) {
        state.blockedCount++;
        ev("main-thread-blocked", { heapMB: state.lastHeapMB });
      }
      // crash 直後の evaluate 失敗などは無視（crash イベント側で記録済み）
    }

    // 3) スクリーンショット（最初の30秒は2秒毎、以降10秒毎）
    const shotInterval = tMs < 30_000 ? 2_000 : 10_000;
    if (tickStart - lastShotAt >= shotInterval && !state.crashed) {
      lastShotAt = tickStart;
      await withTimeout(
        page.screenshot({ path: path.join(SHOT_DIR, `t${tMs}.png`) }),
        3_000,
      ).catch(() => {});
    }

    // ハートビート（10秒毎）
    if (Math.floor(tMs / 10_000) !== Math.floor((tMs - SAMPLE_MS) / 10_000)) {
      console.log(
        `[HB][iter${iter}] +${Math.round(tMs / 1000)}s heap=${state.lastHeapMB}MB state=${state.contentState} blocked=${state.blockedCount}`,
      );
    }

    const elapsed = Date.now() - tickStart;
    if (elapsed < SAMPLE_MS) await new Promise((r) => setTimeout(r, SAMPLE_MS - elapsed));
  }

  await gotoPromise.catch(() => {});
  if (!state.crashed) {
    await page.screenshot({ path: path.join(SHOT_DIR, "final.png") }).catch(() => {});
  }
  await browser.close().catch(() => {});

  // ===== 判定 =====
  let verdict = "OK";
  if (state.crashed) verdict = "CRASH_ON_FIRST_LOAD";
  else if (state.whiteScreenAtMs != null) verdict = "WHITE_SCREEN";
  else if (state.domContentLoadedAtMs == null) verdict = "LOAD_TIMEOUT";
  else if (state.maxHeapMB > HEAP_SUSPICIOUS_MB || state.blockedCount >= 5) verdict = "SUSPICIOUS";

  const summary = {
    iteration: iter,
    baseUrl: BASE_URL + TARGET_PATH,
    cpuRate: CPU_RATE,
    heapLimitMB: HEAP_MB || null,
    windowSec: WINDOW_SEC,
    verdict,
    crashAtMs: state.crashAtMs,
    domContentLoadedAtMs: state.domContentLoadedAtMs,
    fcpAtMs: state.fcpAtMs,
    contentSeenAtMs: state.contentSeenAtMs,
    whiteScreenAtMs: state.whiteScreenAtMs,
    maxHeapMB: state.maxHeapMB,
    lastHeapMB: state.lastHeapMB,
    mainThreadBlockedCount: state.blockedCount,
    pageErrorCount: state.pageErrorCount,
    trpcRequestCount: state.trpcRequests.length,
    trpcRequests: state.trpcRequests.slice(0, 50),
    outDir: OUT_DIR,
  };
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(
    `[first-load][iter${iter}] 判定=${verdict}` +
      (state.crashAtMs != null ? ` crash+${(state.crashAtMs / 1000).toFixed(1)}s` : "") +
      (state.whiteScreenAtMs != null ? ` 白画面+${(state.whiteScreenAtMs / 1000).toFixed(1)}s` : "") +
      ` DCL=${state.domContentLoadedAtMs}ms FCP=${state.fcpAtMs}ms maxHeap=${state.maxHeapMB}MB trpc=${state.trpcRequests.length}本`,
  );
  return summary;
}

// ---------- 反復 + 集計 ----------
async function main() {
  console.log(`[first-load] 対象: ${BASE_URL + TARGET_PATH} / ${ITERATIONS}回反復 / 出力: ${RUN_DIR}`);
  const results = [];
  for (let i = 1; i <= ITERATIONS; i++) {
    try {
      results.push(await runIteration(i));
    } catch (err) {
      console.error(`[first-load][iter${i}] 実行エラー: ${String(err).slice(0, 300)}`);
      results.push({ iteration: i, verdict: "RUNNER_ERROR", error: String(err).slice(0, 300) });
    }
  }

  const crashes = results.filter((r) => r.verdict === "CRASH_ON_FIRST_LOAD").length;
  const whites = results.filter((r) => r.verdict === "WHITE_SCREEN").length;
  const aggregate = {
    baseUrl: BASE_URL + TARGET_PATH,
    iterations: ITERATIONS,
    crashCount: crashes,
    whiteScreenCount: whites,
    verdicts: results.map((r) => r.verdict),
    results,
  };
  fs.writeFileSync(path.join(RUN_DIR, "aggregate.json"), JSON.stringify(aggregate, null, 2));

  console.log("\n===== 初回ロード検査結果 =====");
  console.log(`クラッシュ: ${crashes}/${ITERATIONS} / 白画面: ${whites}/${ITERATIONS}`);
  console.log(`判定一覧: ${aggregate.verdicts.join(", ")}`);
  console.log(`詳細: ${RUN_DIR}`);
  console.log("==============================\n");

  return crashes > 0 || whites > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[first-load] 致命的エラー: ${err?.stack ?? err}`);
    process.exit(1);
  });
