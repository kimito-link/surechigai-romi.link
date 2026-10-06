/**
 * タブ遷移待ち — 調査専用 E2E（WS2/WS3/WS4）
 *
 * 実行例（本番）:
 *   PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm exec playwright test tab-wait-investigation.spec.ts --project=tab-wait-investigation
 *
 * 成果物:
 *   docs/investigation/artifacts/tab-wait-samples.json
 *   docs/investigation/tab-wait-timings.md（追記）
 *   docs/investigation/artifacts/chunk-top5.json
 */
import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  appendMarkdownTimings,
  measureTabNavigation,
  summarizeChunks,
  writeSamples,
  type TabWaitSample,
} from "./helpers/tab-wait-metrics";
import { hasUsableAuthState, resolveAuthStatePath } from "./helpers/auth-state";

const authFile = resolveAuthStatePath();
// 空ファイル（ログイン未完了の残骸）はゲスト実行になるので「無い」扱いにする
const hasAuth = hasUsableAuthState(authFile);

const GUEST_TABS: { path: string; heading: RegExp; label: string }[] = [
  { path: "/", heading: /キミの|現在地|ログイン/, label: "post" },
  { path: "/checkin", heading: /チェックイン|現在地を記録/, label: "checkin" },
  { path: "/zukan", heading: /みんなの現在地|図鑑|都道府県/, label: "zukan" },
  { path: "/map", heading: /軌跡|足あと/, label: "map" },
  { path: "/mypage", heading: /マイページ|ログイン/, label: "mypage" },
];

test.describe("tab wait investigation — guest", () => {
  test.describe.configure({ mode: "serial" });

  const samples: TabWaitSample[] = [];

  test.afterAll(() => {
    if (samples.length === 0) return;
    const base =
      process.env.PLAYWRIGHT_BASE_URL ??
      process.env.E2E_BASE_URL ??
      "unknown";
    const envTag = base.includes("localhost") ? "local" : base.includes("kimito") ? "production" : "other";
    writeSamples(`tab-wait-samples-guest-${envTag}.json`, samples);
    appendMarkdownTimings(samples, "docs/investigation/tab-wait-timings.md", base);
    const top5 = summarizeChunks(samples).slice(0, 5);
    writeSamples("chunk-top5-guest.json", samples);
    fs.writeFileSync(
      path.resolve(process.cwd(), "docs/investigation/artifacts/chunk-top5-guest.json"),
      JSON.stringify({ top5, generatedAt: new Date().toISOString() }, null, 2),
    );
  });

  test("LayerA: guest / → /map (cold)", async ({ page }) => {
    const s = await measureTabNavigation(page, {
      scenario: "layerA_guest_home_to_map",
      persona: "guest",
      fromPath: "/",
      toPath: "/map",
      heading: /軌跡|足あと/,
      cold: true,
    });
    samples.push(s);
  });

  test("LayerA: guest /map → /zukan (warm)", async ({ page }) => {
    const s = await measureTabNavigation(page, {
      scenario: "layerA_guest_map_to_zukan",
      persona: "guest",
      fromPath: "/map",
      toPath: "/zukan",
      heading: /みんなの現在地|図鑑|都道府県/,
      cold: false,
    });
    samples.push(s);
  });

  test("guest cold: 5 tabs direct navigation", async ({ page }) => {
    for (const tab of GUEST_TABS) {
      const s = await measureTabNavigation(page, {
        scenario: `guest_cold_direct_${tab.label}`,
        persona: "guest",
        fromPath: "/",
        toPath: tab.path,
        heading: tab.heading,
        cold: true,
      });
      samples.push(s);
    }
  });

  test("guest warm: round-trip / → /map → /", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const toMap = await measureTabNavigation(page, {
      scenario: "guest_warm_home_to_map",
      persona: "guest",
      fromPath: "/",
      toPath: "/map",
      heading: /軌跡|足あと/,
      cold: false,
    });
    samples.push(toMap);

    const backHome = await measureTabNavigation(page, {
      scenario: "guest_warm_map_to_home",
      persona: "guest",
      fromPath: "/map",
      toPath: "/",
      heading: /キミの|現在地|ログイン/,
      cold: false,
    });
    samples.push(backHome);
  });

  test("guest: spinner duration capture / → /map", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const start = Date.now();
    let spinnerMs = 0;
    let sawSpinner = false;

    const goto = page.goto("/map", { waitUntil: "domcontentloaded" });
    const deadline = start + 6000;
    while (Date.now() < deadline) {
      const progress = page.locator('[role="progressbar"]');
      const visible = (await progress.count()) > 0 && (await progress.first().isVisible().catch(() => false));
      if (visible) {
        sawSpinner = true;
        spinnerMs = Date.now() - start;
        break;
      }
      await page.waitForTimeout(40);
    }
    await goto;
    await page.getByText(/軌跡|足あと/).first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});

    samples.push({
      scenario: "guest_spinner_probe_map",
      persona: "guest",
      fromPath: "/",
      toPath: "/map",
      cold: false,
      navigationMs: Date.now() - start,
      shellVisibleMs: null,
      mainHeadingVisibleMs: null,
      spinnerVisibleMs: sawSpinner ? spinnerMs : null,
      tabQueryLoadingMs: null,
      trpcRequestCount: 0,
      jsChunkCount: 0,
      jsChunkTotalKb: 0,
      topChunks: [],
      shellVisibleDuringSpinner: false,
      recordedAt: new Date().toISOString(),
    });
  });
});

(hasAuth ? test.describe : test.describe.skip)("tab wait investigation — authenticated", () => {
  test.use({ storageState: authFile });
  test.describe.configure({ mode: "serial" });

  const samples: TabWaitSample[] = [];

  test.afterAll(() => {
    if (samples.length === 0) return;
    const base =
      process.env.PLAYWRIGHT_BASE_URL ??
      process.env.E2E_BASE_URL ??
      "unknown";
    const envTag = base.includes("localhost") ? "local" : base.includes("kimito") ? "production" : "other";
    writeSamples(`tab-wait-samples-auth-${envTag}.json`, samples);
    appendMarkdownTimings(samples, "docs/investigation/tab-wait-timings.md", base);
    const top5 = summarizeChunks(samples).slice(0, 5);
    fs.writeFileSync(
      path.resolve(process.cwd(), "docs/investigation/artifacts/chunk-top5-auth.json"),
      JSON.stringify({ top5, generatedAt: new Date().toISOString() }, null, 2),
    );
  });

  const AUTH_TABS: { path: string; heading: RegExp; label: string }[] = [
    { path: "/", heading: /ポスト|封筒|新着|チェックイン/, label: "post" },
    { path: "/checkin", heading: /チェックイン/, label: "checkin" },
    { path: "/zukan", heading: /みんなの現在地|図鑑/, label: "zukan" },
    { path: "/map", heading: /軌跡/, label: "map" },
    { path: "/mypage", heading: /マイページ/, label: "mypage" },
  ];

  test("auth cold: 5 tabs direct from /", async ({ page }) => {
    for (const tab of AUTH_TABS) {
      const s = await measureTabNavigation(page, {
        scenario: `auth_cold_direct_${tab.label}`,
        persona: "authenticated",
        fromPath: "/",
        toPath: tab.path,
        heading: tab.heading,
        cold: true,
      });
      samples.push(s);
    }
  });

  test("auth warm: full tab round-trip", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const tab of AUTH_TABS) {
      const s = await measureTabNavigation(page, {
        scenario: `auth_warm_${tab.label}`,
        persona: "authenticated",
        fromPath: "/",
        toPath: tab.path,
        heading: tab.heading,
        cold: false,
      });
      samples.push(s);
    }
    const back = await measureTabNavigation(page, {
      scenario: "auth_warm_return_post",
      persona: "authenticated",
      fromPath: "/mypage",
      toPath: "/",
      heading: /ポスト|封筒|新着/,
      cold: false,
    });
    samples.push(back);
  });

  test("auth: map first vs second visit", async ({ page }) => {
    const first = await measureTabNavigation(page, {
      scenario: "auth_map_first",
      persona: "authenticated",
      fromPath: "/",
      toPath: "/map",
      heading: /軌跡/,
      cold: true,
    });
    samples.push(first);

    const second = await measureTabNavigation(page, {
      scenario: "auth_map_second",
      persona: "authenticated",
      fromPath: "/",
      toPath: "/map",
      heading: /軌跡/,
      cold: false,
    });
    samples.push(second);
  });
});

// WS3: ベースライン拡張（既存 tab-instant-display 相当 + shell during spinner）
test.describe("tab wait baseline assertions — guest", () => {
  test("サイドナビまたはタブバーは /→/map 遷移中も表示されうる", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const shellBefore = await page.getByText("君斗りんく").first().isVisible().catch(() => false);

    void page.goto("/map", { waitUntil: "domcontentloaded" });
    let shellDuring = false;
    for (let i = 0; i < 30; i++) {
      if (await page.getByText("君斗りんく").first().isVisible().catch(() => false)) {
        shellDuring = true;
        break;
      }
      await page.waitForTimeout(100);
    }

    await page.getByText(/軌跡|足あと/).first().waitFor({ state: "visible", timeout: 15000 });

    test.info().annotations.push({
      type: "baseline",
      description: `shellBefore=${shellBefore} shellDuring=${shellDuring}`,
    });
  });
});
