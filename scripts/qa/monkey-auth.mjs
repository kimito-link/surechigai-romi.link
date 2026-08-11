/**
 * monkey-auth.mjs — 認証済み画面の安全なランダム操作テスト。
 *
 * guest版では到達できない認証後タブを、保存済みの Clerk storageState で巡回する。
 * 本番データを汚さないことを最優先にし、操作対象をタブとアプリ内GETリンクに限定する。
 * さらに破壊的な tRPC POST と X OAuth を通信層で遮断し、候補選別の漏れも実行させない。
 * アプリを開くだけで動く presence.setEnabled / presence.pulse は、ユーザーが既に許可した
 * 通常の在席更新なので通すが、操作候補から発生した書き込みとは別に件数を記録する。
 *
 * 使い方:
 *   pnpm qa:monkey:auth
 *   pnpm qa:monkey:auth --minutes=5 --device=desktop
 *   pnpm qa:monkey:auth --auth=.auth/auth-state.json --seed=12345
 *
 * 出力: qa-results/monkey-auth/<timestamp>/
 */

import { chromium, devices } from "playwright";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

function arg(name, fallback) {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const hasFlag = (name) => process.argv.includes(`--${name}`);
const BASE_URL = (
  arg("base-url", null) ??
  process.env.QA_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://surechigai.kimito.link"
).replace(/\/$/, "");
const AUTH_STATE_PATH = path.resolve(ROOT, arg("auth", ".auth/auth-state.json"));
const MINUTES = Number(arg("minutes", "3"));
const DEVICE_NAME = arg("device", "mobile") === "desktop" ? "Desktop Chrome" : "Pixel 5";
const SEED = Number(arg("seed", "42"));
const TICK_MS = Number(arg("tick-ms", "1500"));
const HEADED = hasFlag("headed");

function hasUsableAuthState(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const cookies = Array.isArray(saved.cookies) ? saved.cookies : [];
    const uat = cookies.find((cookie) => cookie.name?.startsWith("__client_uat"));
    return Boolean(uat?.value && uat.value !== "0");
  } catch {
    return false;
  }
}

if (!hasUsableAuthState(AUTH_STATE_PATH)) {
  console.error(
    `[monkey-auth] 有効な認証状態がありません: ${AUTH_STATE_PATH}\n` +
      "先に pnpm e2e:auth-save を実行してください。ゲスト状態で偽の緑は作りません。",
  );
  process.exit(2);
}

function makeRng(seed) {
  let state = seed >>> 0 || 1;
  return function rng() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

const rng = makeRng(SEED);
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT_DIR = path.join(ROOT, "qa-results", "monkey-auth", stamp);
const SHOTS_DIR = path.join(OUT_DIR, "shots");
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const actionsStream = fs.createWriteStream(path.join(OUT_DIR, "actions.ndjson"), { flags: "a" });
const eventsStream = fs.createWriteStream(path.join(OUT_DIR, "events.ndjson"), { flags: "a" });
const csvPath = path.join(OUT_DIR, "metrics.csv");
fs.writeFileSync(csvPath, "elapsedMs,jsHeapUsedMB,nodes,contentState\n");

const ALLOWED_CONSOLE_ERROR = [
  /favicon\.ico/i,
  /ResizeObserver loop/i,
  /Expo push token/i,
  /Require cycles are allowed/i,
  /Failed to load resource.*404/i,
  /MIME type.*is not executable/i,
  /Refused to execute script.*_expo\/static/i,
];
const ALLOWED_404_PATHS = [/favicon\.ico/, /apple-touch-icon/, /manifest\.json/];
const BLOCKED_HREF =
  /(?:sign-in|sign-up|sign-out|logout|oauth|delete|deletion|report|block|checkout|billing|purchase)/i;
const HEAP_SUSPICIOUS_MB = 800;
const WHITE_SCREEN_CONFIRM_DELAY_MS = 1500;

let startedAt = 0;
let crashed = false;
let tickCount = 0;
let contentState = "NONE";
const visitedPaths = new Set();
const events = [];
const blockedMutations = [];
const blockedOauth = [];
const backgroundPresenceMutations = [];

const elapsedMs = () => Date.now() - startedAt;
const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

function logAction(action) {
  actionsStream.write(JSON.stringify({ atMs: elapsedMs(), ...action }) + "\n");
}

function logEvent(type, detail) {
  const event = { atMs: elapsedMs(), type, detail };
  events.push(event);
  eventsStream.write(JSON.stringify(event) + "\n");
}

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
    return;
  }
  if (contentState !== "CONTENT" || probe.textLen >= 5 || probe.childCount > 1) return;

  await page.waitForTimeout(WHITE_SCREEN_CONFIRM_DELAY_MS);
  const recheck = await probeContent(page);
  if (recheck && recheck.textLen < 5 && recheck.childCount <= 1) {
    contentState = "BLANK";
    logEvent("white_screen", recheck);
    await page
      .screenshot({ path: path.join(SHOTS_DIR, `white-screen-${elapsedMs()}.png`) })
      .catch(() => {});
  }
}

async function clickRandomTab(page) {
  // role="tab" を使う。a[href] では Pressable 実装のサイドナビを巡回できない。
  const tabs = page.getByRole("tab");
  const count = await tabs.count().catch(() => 0);
  if (count === 0) return { kind: "tab", skipped: "no-tabs" };

  const start = Math.floor(rng() * count);
  for (let offset = 0; offset < count; offset++) {
    const index = (start + offset) % count;
    const tab = tabs.nth(index);
    if (!(await tab.isVisible().catch(() => false))) continue;
    const label =
      (await tab.getAttribute("aria-label").catch(() => null)) ??
      (await tab.innerText().catch(() => ""));
    await tab.click({ timeout: 3000 });
    await page.waitForTimeout(300);
    const pathname = new URL(page.url()).pathname || "/";
    visitedPaths.add(pathname);
    return { kind: "tab", index, label: label.slice(0, 50), path: pathname };
  }
  return { kind: "tab", skipped: "no-visible-tab" };
}

async function clickRandomSafeLink(page) {
  const links = page.locator('a[href^="/"]');
  const count = await links.count().catch(() => 0);
  if (count === 0) return { kind: "link", skipped: "no-links" };

  const start = Math.floor(rng() * count);
  for (let offset = 0; offset < count; offset++) {
    const index = (start + offset) % count;
    const link = links.nth(index);
    if (!(await link.isVisible().catch(() => false))) continue;
    const href = (await link.getAttribute("href").catch(() => null)) ?? "";
    if (!href.startsWith("/") || BLOCKED_HREF.test(href)) continue;

    const text = await link.innerText().catch(() => "");
    await link.click({ timeout: 3000 });
    await page.waitForTimeout(300);
    const pathname = new URL(page.url()).pathname || "/";
    visitedPaths.add(pathname);
    return { kind: "link", index, href, text: text.slice(0, 50), path: pathname };
  }
  return { kind: "link", skipped: "no-safe-visible-link" };
}

async function tick(page, cdp) {
  tickCount++;
  const roll = rng();
  if (roll < 0.4) {
    const dy = Math.round((rng() - 0.5) * 800);
    await page.mouse.wheel(0, dy).catch(() => {});
    logAction({ type: "scroll", dy });
  } else if (roll < 0.78) {
    logAction({ type: "navigate", result: await clickRandomTab(page) });
  } else {
    logAction({ type: "navigate", result: await clickRandomSafeLink(page) });
  }

  await checkWhiteScreen(page);
  const { metrics } = await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] }));
  const get = (name) => metrics.find((metric) => metric.name === name)?.value ?? 0;
  const heapMB = toMB(get("JSHeapUsedSize"));
  const nodes = get("Nodes");
  fs.appendFileSync(csvPath, `${elapsedMs()},${heapMB},${nodes},${contentState}\n`);
  if (heapMB > HEAP_SUSPICIOUS_MB) logEvent("heap_suspicious", { heapMB });
}

async function verifyAuthenticated(page) {
  await page.goto(`${BASE_URL}/mypage`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(3000);
  const url = page.url();
  const bodyText = await page.locator("body").innerText().catch(() => "");
  // 「公開ページを見る」は認証済みプロフィールカードだけに存在する。
  // ログアウトは折りたたみ設定内なので、未展開時の判定には使えない。
  const authenticated = !url.includes("/sign-in") && bodyText.includes("公開ページを見る");
  if (!authenticated) {
    await page.screenshot({ path: path.join(SHOTS_DIR, "auth-invalid.png"), fullPage: true }).catch(() => {});
    logEvent("auth_invalid", {
      url,
      hasAuthenticatedProfileAction: bodyText.includes("公開ページを見る"),
    });
  }
  return authenticated;
}

async function main() {
  console.log(`[monkey-auth] 対象: ${BASE_URL} (authenticated, read-only actions)`);
  console.log(
    `[monkey-auth] 条件: ${MINUTES}分 / device=${DEVICE_NAME} / seed=${SEED} / tick=${TICK_MS}ms`,
  );
  console.log(`[monkey-auth] 出力: ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    ...devices[DEVICE_NAME],
    storageState: AUTH_STATE_PATH,
  });
  const page = await context.newPage();

  const blockOauth = async (route) => {
    blockedOauth.push(route.request().url());
    logEvent("oauth_blocked", route.request().url());
    await route.fulfill({ status: 204, contentType: "text/plain", body: "blocked by auth monkey" });
  };
  await page.route("https://x.com/**", blockOauth);
  await page.route("https://twitter.com/**", blockOauth);

  // 候補フィルタに漏れがあっても、破壊的な本番書き込みはここで止める。
  await page.route("**/api/trpc/**", async (route) => {
    if (route.request().method() === "POST") {
      const requestUrl = route.request().url();
      const procedureSegment = new URL(requestUrl).pathname.split("/api/trpc/")[1] ?? "";
      const procedures = decodeURIComponent(procedureSegment).split(",").filter(Boolean);
      const isBackgroundPresence =
        procedures.length > 0 &&
        procedures.every((procedure) =>
          ["presence.setEnabled", "presence.pulse"].includes(procedure),
        );

      if (isBackgroundPresence) {
        backgroundPresenceMutations.push(...procedures);
        logAction({ type: "background-presence", procedures });
        await route.continue();
        return;
      }

      blockedMutations.push(requestUrl);
      logEvent("mutation_blocked", requestUrl);
      await route.fulfill({ status: 403, contentType: "application/json", body: '{"error":"blocked"}' });
      return;
    }
    await route.continue();
  });

  page.on("crash", () => {
    crashed = true;
    logEvent("crash", null);
  });
  page.on("pageerror", (error) => logEvent("pageerror", error.message.slice(0, 300)));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (ALLOWED_CONSOLE_ERROR.some((pattern) => pattern.test(text))) return;
    logEvent("console_error", text.slice(0, 300));
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;
    const url = response.url();
    if (status === 404 && ALLOWED_404_PATHS.some((pattern) => pattern.test(url))) return;
    if (status === 403 && blockedMutations.includes(url)) return;
    logEvent("http_error", `${status} ${url}`);
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  startedAt = Date.now();

  const authenticated = await verifyAuthenticated(page);
  if (authenticated) {
    visitedPaths.add("/mypage");
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(2000);
    visitedPaths.add("/");
    await checkWhiteScreen(page);

    const endAtMs = MINUTES * 60 * 1000;
    while (elapsedMs() < endAtMs && !crashed) {
      await tick(page, cdp).catch((error) => logEvent("tick_error", String(error).slice(0, 300)));
      await page.waitForTimeout(TICK_MS);
    }
  }

  await page.screenshot({ path: path.join(SHOTS_DIR, "final.png"), fullPage: true }).catch(() => {});
  await browser.close();

  let verdict = "OK";
  if (!authenticated) verdict = "AUTH_INVALID";
  else if (blockedMutations.length > 0) verdict = "MUTATION_BLOCKED";
  else if (blockedOauth.length > 0) verdict = "OAUTH_BLOCKED";
  else if (crashed) verdict = "OOM_CRASH";
  else if (events.some((event) => event.type === "white_screen")) verdict = "WHITE_SCREEN";
  else if (events.some((event) => event.type === "pageerror")) verdict = "PAGEERROR";
  else if (events.some((event) => event.type === "http_error")) verdict = "HTTP_ERROR";
  else if (events.some((event) => event.type === "heap_suspicious")) verdict = "SUSPICIOUS";
  else if (events.filter((event) => event.type === "console_error").length >= 5) {
    verdict = "CONSOLE_ERROR_STORM";
  }

  const summary = {
    verdict,
    authenticated,
    baseUrl: BASE_URL,
    device: DEVICE_NAME,
    seed: SEED,
    minutes: MINUTES,
    ticks: tickCount,
    visitedPaths: [...visitedPaths],
    blockedMutationCount: blockedMutations.length,
    blockedOauthCount: blockedOauth.length,
    backgroundPresenceMutationCount: backgroundPresenceMutations.length,
    eventCounts: events.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
      return counts;
    }, {}),
  };
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n===== 認証済みモンキーテスト結果 =====");
  console.log(`判定: ${verdict}`);
  console.log(`ticks: ${tickCount} / 訪問パス: ${[...visitedPaths].join(", ")}`);
  console.log(
    `blockedMutations: ${blockedMutations.length} / blockedOauth: ${blockedOauth.length}`,
  );
  console.log(`backgroundPresenceMutations: ${backgroundPresenceMutations.length}`);
  console.log(`詳細: ${OUT_DIR}`);
  console.log("======================================\n");

  actionsStream.end();
  eventsStream.end();
  process.exit(verdict === "OK" ? 0 : 1);
}

main().catch((error) => {
  console.error("[monkey-auth] fatal:", error);
  process.exit(1);
});
