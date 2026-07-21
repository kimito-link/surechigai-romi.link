/**
 * monkey-guest.mjs — ゲスト画面ランダム操作モンキーテスト
 *
 * 目的: OneTapGuestShell ヒーロー化 + ZukanGuestLive 実データ化（2026-07-17）の
 * 回帰確認として、既存のE2Eスモーク（固定シナリオ）では踏めない未知の操作経路
 * （ランダムなクリック・スクロール・タブ遷移の組み合わせ）でクラッシュ/白画面/
 * console error 等を探す。docs/qa-toolkit-design.md 系の既存ツール群と役割を分ける:
 *   - auth-home-soak.mjs   … 認証済みホームの「固定順序・低頻度」長時間滞在OOM検出
 *   - first-load-crash.mjs … 操作なしの初回マウント観測
 *   - monkey-guest.mjs（本スクリプト） … ゲストのみ、ランダム操作で未知の経路を踏む
 *
 * 安全設計（最重要）: ゲスト画面(OneTapGuestShell配下)には useMutation が一切ない
 * ことを実装調査で確認済み（2026-07-17）。書き込みミューテーションは全て
 * *-authenticated-screen.tsx 系に閉じているため、本スクリプトは認証状態を一切
 * 使わず常にゲストコンテキストで実行し、DB汚染リスクを構造的にゼロにする。
 * 加えて多層防御（許可リスト方式のクリックフィルタ、X OAuthのroute intercept、
 * tRPC POST観測）でガードレールを敷く。詳細は docs/qa-toolkit-design.md §4
 * 「QAツールは本番相当のURL・パラメータでアクセスする」原則も参照。
 *
 * 使い方:
 *   pnpm qa:monkey                                  # 既定: 本番URL・モバイル・3分・シード固定
 *   pnpm qa:monkey --minutes=5
 *   pnpm qa:monkey --device=desktop
 *   pnpm qa:monkey --base-url=http://localhost:8081
 *   pnpm qa:monkey --seed=12345
 *   pnpm qa:monkey --headed
 *
 * 出力: qa-results/monkey/<timestamp>/
 *   - actions.ndjson … 実施したアクションの時系列
 *   - events.ndjson  … crash/pageerror/console/http-error/mutation-observed/white-screen
 *   - metrics.csv    … tick毎のヒープ/ノード数
 *   - shots/         … 異常検知時のみ
 *   - summary.json   … 判定+統計
 */

import { chromium, devices } from "playwright";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
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
const MINUTES = Number(arg("minutes", "3"));
const DEVICE_NAME = arg("device", "mobile") === "desktop" ? "Desktop Chrome" : "Pixel 5";
const SEED = Number(arg("seed", "42"));
const TICK_MS = Number(arg("tick-ms", "1500"));
const HEADED = hasFlag("headed");

// ---------- 決定的な乱数（再現性のため Math.random は使わない） ----------
function makeRng(seed) {
  let state = seed >>> 0 || 1;
  return function rng() {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}
const rng = makeRng(SEED);

// ---------- 出力先 ----------
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT_DIR = path.join(ROOT, "qa-results", "monkey", stamp);
const SHOTS_DIR = path.join(OUT_DIR, "shots");
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const actionsStream = fs.createWriteStream(path.join(OUT_DIR, "actions.ndjson"), { flags: "a" });
const eventsStream = fs.createWriteStream(path.join(OUT_DIR, "events.ndjson"), { flags: "a" });
const csvPath = path.join(OUT_DIR, "metrics.csv");
fs.writeFileSync(csvPath, "elapsedMs,jsHeapUsedMB,nodes,contentState\n");

const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

function logAction(action) {
  actionsStream.write(JSON.stringify({ atMs: elapsedMs(), ...action }) + "\n");
}
function logEvent(type, detail) {
  eventsStream.write(JSON.stringify({ atMs: elapsedMs(), type, detail }) + "\n");
  events.push({ type, detail, atMs: elapsedMs() });
}

// ---------- 判定しきい値 ----------
const CONSOLE_ERROR_STORM_MIN = 5;
const HEAP_SUSPICIOUS_MB = 800;

// console.error の許容パターン（tests/e2e/helpers/smoke-monitor.ts の
// ALLOWED_CONSOLE_ERROR と値を同期。出典: 2026-07-17時点のコピー。
// 値が乖離したら smoke-monitor.ts 側を正として更新すること）
const ALLOWED_CONSOLE_ERROR = [
  /favicon\.ico/i,
  /ResizeObserver loop/i,
  /Expo push token/i,
  /Require cycles are allowed/i,
  /Failed to load resource.*404/i,
  /clerk.*development/i,
  /MIME type.*is not executable/i,
  /Refused to execute script.*_expo\/static/i,
];
const ALLOWED_404_PATHS = [/favicon\.ico/, /apple-touch-icon/, /manifest\.json/];

// ---------- 状態 ----------
let startedAt = 0;
const elapsedMs = () => Date.now() - startedAt;
const events = [];
let crashed = false;
let mutationAttempts = [];
let xOauthAttempts = [];
let contentState = "NONE"; // NONE -> CONTENT -> BLANK
let tickCount = 0;
let visitedPaths = new Set();

async function isClickSafe(locator) {
  const href = await locator.getAttribute("href").catch(() => null);
  if (href) {
    if (/^https?:\/\/(x|twitter)\.com/i.test(href)) return false;
    if (href.includes("/sign-in") || href.includes("auto=x")) return false;
    if (!href.startsWith("/") && !href.startsWith("#")) return false;
  }
  const ariaLabel = await locator.getAttribute("aria-label").catch(() => null);
  if (ariaLabel && /X|ログイン|シェア|共有/i.test(ariaLabel)) return false;
  return true;
}

async function pickAndClickSafeElement(page) {
  const candidates = page.locator(
    'a[href^="/"], [role="button"]:not([aria-label*="X"]):not([aria-label*="ログイン"])',
  );
  const count = await candidates.count().catch(() => 0);
  if (count === 0) return null;
  const idx = Math.floor(rng() * count);
  const el = candidates.nth(idx);
  const visible = await el.isVisible().catch(() => false);
  if (!visible) return null;
  const safe = await isClickSafe(el);
  if (!safe) return null;
  const text = await el.innerText().catch(() => "");
  const href = await el.getAttribute("href").catch(() => null);
  await el.click({ timeout: 3000 }).catch((e) => {
    logEvent("click_error", String(e).slice(0, 200));
  });
  return { text: text.slice(0, 40), href };
}

/**
 * 白画面判定はSPA内遷移中の一瞬(Reactが新ツリーを組む間、textLenが一時的に
 * 0になる瞬間)を誤検知しないよう、「空の状態が続くこと」を1回の再チェック
 * (WHITE_SCREEN_CONFIRM_DELAY_MS 後)で確認してから確定する。first-load-crash.mjs
 * の単発巡回とは異なり、本スクリプトはページ遷移を繰り返すため、この猶予が必須。
 */
const WHITE_SCREEN_CONFIRM_DELAY_MS = 1500;

async function probeContent(page) {
  return page
    .evaluate(() => {
      const root = document.getElementById("root") ?? document.body;
      const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();
      return { textLen: text.length, childCount: root.children.length };
    })
    .catch(() => null);
}

async function checkWhiteScreen(page) {
  const probe = await probeContent(page);
  if (!probe) return;
  if (contentState === "NONE" && probe.textLen > 20) {
    contentState = "CONTENT";
  } else if (contentState === "CONTENT" && probe.textLen < 5 && probe.childCount <= 1) {
    // 遷移中の過渡状態を除外するため、少し待って再確認する
    await page.waitForTimeout(WHITE_SCREEN_CONFIRM_DELAY_MS);
    const recheck = await probeContent(page);
    if (recheck && recheck.textLen < 5 && recheck.childCount <= 1) {
      contentState = "BLANK";
      logEvent("white_screen", { textLen: recheck.textLen, childCount: recheck.childCount });
      await page
        .screenshot({ path: path.join(SHOTS_DIR, `white-screen-${elapsedMs()}.png`) })
        .catch(() => {});
    }
  }
}

async function tick(page, cdp) {
  tickCount++;
  const roll = rng();
  if (roll < 0.35) {
    const dy = Math.round((rng() - 0.5) * 800);
    await page.mouse.wheel(0, dy).catch(() => {});
    logAction({ type: "scroll", dy });
  } else if (roll < 0.65) {
    // role="tab"ベースで選択（モバイル下部タブバー・デスクトップWebSideNavの両方に
    // accessibilityRole="tab"が付与されている。a[href]セレクタはWebSideNavが
    // Pressable+onPressでプログラム的に遷移する実装のため機能しない=デスクトップで
    // ホーム画面以外に一切遷移できなくなる既知の不具合。実機検証で確定・2026-07-21修正）
    const tabs = page.getByRole("tab");
    const count = await tabs.count().catch(() => 0);
    if (count > 0) {
      const idx = Math.floor(rng() * count);
      const tabEl = tabs.nth(idx);
      const visible = await tabEl.isVisible().catch(() => false);
      if (visible) {
        await tabEl.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        const currentPath = new URL(page.url()).pathname || "/";
        visitedPaths.add(currentPath);
        logAction({ type: "tab", index: idx, path: currentPath });
      } else {
        logAction({ type: "tab_skip_not_visible", index: idx });
      }
    } else {
      logAction({ type: "tab_skip_no_tabs_found" });
    }
  } else {
    const result = await pickAndClickSafeElement(page);
    logAction({ type: "click", result });
  }

  await checkWhiteScreen(page);

  const { metrics } = await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] }));
  const get = (name) => metrics.find((m) => m.name === name)?.value ?? 0;
  const heapMB = toMB(get("JSHeapUsedSize"));
  const nodes = get("Nodes");
  fs.appendFileSync(csvPath, `${elapsedMs()},${heapMB},${nodes},${contentState}\n`);
  if (heapMB > HEAP_SUSPICIOUS_MB) {
    logEvent("heap_suspicious", { heapMB });
  }
}

async function main() {
  console.log(`[monkey] 対象: ${BASE_URL} (guest only, no auth)`);
  console.log(
    `[monkey] 条件: ${MINUTES}分 / device=${DEVICE_NAME} / seed=${SEED} / tick=${TICK_MS}ms`,
  );
  console.log(`[monkey] 出力: ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ ...devices[DEVICE_NAME] });
  const page = await context.newPage();

  // --- ガードレール1: X OAuth への到達を最終防波堤でブロック ---
  const blockXOauth = async (route) => {
    xOauthAttempts.push(route.request().url());
    logEvent("x_oauth_leak", route.request().url());
    await route.fulfill({ status: 204, contentType: "text/plain", body: "blocked by monkey test" });
  };
  await page.route("https://x.com/**", blockXOauth);
  await page.route("https://twitter.com/**", blockXOauth);

  // --- ガードレール2: tRPC mutation(POST)の観測。ブロックはしない(本番相当原則を優先) ---
  await page.route("**/api/trpc/**", async (route) => {
    if (route.request().method() === "POST") {
      mutationAttempts.push(route.request().url());
      logEvent("mutation_observed", route.request().url());
    }
    await route.continue();
  });

  page.on("crash", () => {
    crashed = true;
    logEvent("crash", null);
  });
  page.on("pageerror", (err) => logEvent("pageerror", err.message.slice(0, 300)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ALLOWED_CONSOLE_ERROR.some((re) => re.test(text))) return;
    logEvent("console_error", text.slice(0, 300));
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    if (status === 404 && ALLOWED_404_PATHS.some((re) => re.test(url))) return;
    if (status === 401 && url.includes("/api/trpc")) return;
    logEvent("http_error", `${status} ${url}`);
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");

  startedAt = Date.now();
  await page.goto(BASE_URL + "/", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(2000);
  visitedPaths.add("/");
  await checkWhiteScreen(page);

  const endAtMs = MINUTES * 60 * 1000;
  while (elapsedMs() < endAtMs && !crashed) {
    await tick(page, cdp).catch((e) => {
      logEvent("tick_error", String(e).slice(0, 300));
    });
    await page.waitForTimeout(TICK_MS);
  }

  await page
    .screenshot({ path: path.join(SHOTS_DIR, "final.png"), fullPage: true })
    .catch(() => {});

  await browser.close();

  // ---------- 判定 ----------
  let verdict = "OK";
  if (mutationAttempts.length > 0) verdict = "MUTATION_OBSERVED";
  else if (crashed) verdict = "OOM_CRASH";
  else if (xOauthAttempts.length > 0) verdict = "X_OAUTH_LEAK";
  else if (events.some((e) => e.type === "white_screen")) verdict = "WHITE_SCREEN";
  else if (events.some((e) => e.type === "pageerror")) verdict = "PAGEERROR";
  else if (events.filter((e) => e.type === "console_error").length >= CONSOLE_ERROR_STORM_MIN)
    verdict = "CONSOLE_ERROR_STORM";
  else if (events.some((e) => e.type === "http_error")) verdict = "HTTP_ERROR";
  else if (events.some((e) => e.type === "heap_suspicious")) verdict = "SUSPICIOUS";

  const summary = {
    verdict,
    baseUrl: BASE_URL,
    device: DEVICE_NAME,
    seed: SEED,
    minutes: MINUTES,
    ticks: tickCount,
    visitedPaths: [...visitedPaths],
    mutationAttempts,
    xOauthAttempts,
    eventCounts: events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1;
      return acc;
    }, {}),
  };
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`\n===== モンキーテスト結果 =====`);
  console.log(`判定: ${verdict}`);
  console.log(`ticks: ${tickCount} / 訪問パス: ${[...visitedPaths].join(", ")}`);
  console.log(`mutationAttempts: ${mutationAttempts.length} / xOauthAttempts: ${xOauthAttempts.length}`);
  console.log(`詳細: ${OUT_DIR}`);
  console.log(`==============================\n`);

  actionsStream.end();
  eventsStream.end();

  process.exit(verdict === "OK" ? 0 : 1);
}

main().catch((err) => {
  console.error("[monkey] fatal:", err);
  process.exit(1);
});
