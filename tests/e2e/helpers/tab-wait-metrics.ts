import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export type ChunkResource = {
  url: string;
  transferSize: number;
  durationMs: number;
};

export type TabWaitSample = {
  scenario: string;
  persona: "guest" | "authenticated";
  fromPath: string;
  toPath: string;
  cold: boolean;
  navigationMs: number;
  shellVisibleMs: number | null;
  mainHeadingVisibleMs: number | null;
  spinnerVisibleMs: number | null;
  tabQueryLoadingMs: number | null;
  trpcRequestCount: number;
  jsChunkCount: number;
  jsChunkTotalKb: number;
  topChunks: ChunkResource[];
  shellVisibleDuringSpinner: boolean;
  recordedAt: string;
};

const ARTIFACTS_DIR = path.resolve(process.cwd(), "docs/investigation/artifacts");

export function ensureArtifactsDir(): void {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

export function writeSamples(filename: string, samples: TabWaitSample[]): string {
  ensureArtifactsDir();
  const outPath = path.join(ARTIFACTS_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify({ samples, generatedAt: new Date().toISOString() }, null, 2));
  return outPath;
}

export function appendMarkdownTimings(samples: TabWaitSample[], mdPath: string, envLabel?: string): void {
  ensureArtifactsDir();
  const fullPath = path.join(process.cwd(), mdPath);
  const env =
    envLabel ??
    process.env.PLAYWRIGHT_BASE_URL ??
    process.env.E2E_BASE_URL ??
    "unknown";
  const rows = samples
    .map(
      (s) =>
        `| ${s.scenario} | ${s.persona} | ${s.toPath} | ${s.cold ? "cold" : "warm"} | ${s.shellVisibleMs ?? "—"} | ${s.mainHeadingVisibleMs ?? "—"} | ${s.spinnerVisibleMs ?? "—"} | ${s.jsChunkTotalKb} | ${s.trpcRequestCount} |`,
    )
    .join("\n");

  const block = `
## 計測バッチ (${samples[0]?.recordedAt?.slice(0, 10) ?? "unknown"}) — ${env}

| scenario | persona | route | cold/warm | shellVisible_ms | mainContent_ms | fullSpinner_ms | chunk_kb | trpc_count |
|----------|---------|-------|-----------|-----------------|----------------|----------------|----------|------------|
${rows}
`;

  if (fs.existsSync(fullPath)) {
    fs.appendFileSync(fullPath, block);
  } else {
    const header = `# タブ遷移待ち — 計測結果（WS2）

本番/ローカル Playwright 調査スクリプト \`tab-wait-investigation.spec.ts\` の出力。

`;
    fs.writeFileSync(fullPath, header + block);
  }
}

async function isShellVisible(page: Page): Promise<boolean> {
  const sideNav = page.getByText("君斗りんく").first();
  const tabPost = page.getByRole("tab", { name: /ポスト/ });
  const headerLogin = page.getByRole("button", { name: /ログイン/ });
  return (
    (await sideNav.isVisible().catch(() => false)) ||
    (await tabPost.isVisible().catch(() => false)) ||
    (await headerLogin.isVisible().catch(() => false))
  );
}

async function isSpinnerLikeVisible(page: Page): Promise<boolean> {
  const progress = page.locator('[role="progressbar"]');
  const tabLoading = page.getByTestId("tab-query-loading");
  const count = await progress.count();
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      if (await progress.nth(i).isVisible().catch(() => false)) return true;
    }
  }
  return tabLoading.isVisible().catch(() => false);
}

function collectResources(page: Page, sinceMs: number): Promise<{
  trpcCount: number;
  chunks: ChunkResource[];
}> {
  return page.evaluate((since) => {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const recent = entries.filter((e) => e.startTime >= since);
    const trpcCount = recent.filter((e) => e.name.includes("/api/trpc")).length;
    const jsChunks = recent
      .filter((e) => /\.js(\?|$)/.test(e.name) && (e.transferSize ?? 0) > 0)
      .map((e) => ({
        url: e.name.split("/").pop()?.slice(0, 80) ?? e.name,
        transferSize: e.transferSize ?? 0,
        durationMs: Math.round(e.duration),
      }))
      .sort((a, b) => b.transferSize - a.transferSize);
    return { trpcCount, chunks: jsChunks };
  }, sinceMs);
}

export type MeasureTabNavOptions = {
  scenario: string;
  persona: "guest" | "authenticated";
  fromPath: string;
  toPath: string;
  heading: string | RegExp;
  cold: boolean;
};

/** タブ遷移の待ち時間をサンプリング（調査用・閾値 assert なし） */
export async function measureTabNavigation(
  page: Page,
  options: MeasureTabNavOptions,
): Promise<TabWaitSample> {
  const { scenario, persona, fromPath, toPath, heading, cold } = options;

  if (cold) {
    await page.goto(fromPath, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
  } else if (fromPath !== toPath) {
    await page.goto(fromPath, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
  }

  const perfStart = await page.evaluate(() => performance.now());
  let trpcSeen = 0;
  const trpcHandler = (req: { url: () => string }) => {
    if (req.url().includes("/api/trpc")) trpcSeen += 1;
  };
  page.on("request", trpcHandler);

  const navPromise = page.goto(toPath, { waitUntil: "domcontentloaded" });

  let shellVisibleMs: number | null = null;
  let spinnerVisibleMs: number | null = null;
  let tabQueryLoadingMs: number | null = null;
  let shellDuringSpinner = false;
  const pollStart = Date.now();
  const pollDeadline = pollStart + 8000;

  while (Date.now() < pollDeadline) {
    const elapsed = Date.now() - pollStart;
    if (shellVisibleMs === null && (await isShellVisible(page))) {
      shellVisibleMs = elapsed;
    }
    const spinning = await isSpinnerLikeVisible(page);
    if (spinning) {
      if (spinnerVisibleMs === null) spinnerVisibleMs = elapsed;
      if (await isShellVisible(page)) shellDuringSpinner = true;
    }
    if (await page.getByTestId("tab-query-loading").isVisible().catch(() => false)) {
      if (tabQueryLoadingMs === null) tabQueryLoadingMs = elapsed;
    }
    if (await page.getByText(heading).first().isVisible().catch(() => false)) {
      break;
    }
    await page.waitForTimeout(50);
  }

  await navPromise;

  const headingWaitStart = Date.now();
  await page
    .getByText(heading)
    .first()
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => {});
  const mainHeadingVisibleMs = Date.now() - pollStart;

  await page.waitForTimeout(400);

  const navigationMs = Math.round(await page.evaluate(() => performance.now()) - perfStart);
  const { trpcCount: perfTrpc, chunks } = await collectResources(page, perfStart);
  page.off("request", trpcHandler);

  const jsChunkTotalKb = Math.round(chunks.reduce((sum, c) => sum + c.transferSize, 0) / 1024);

  return {
    scenario,
    persona,
    fromPath,
    toPath,
    cold,
    navigationMs,
    shellVisibleMs,
    mainHeadingVisibleMs,
    spinnerVisibleMs,
    tabQueryLoadingMs,
    trpcRequestCount: Math.max(trpcSeen, perfTrpc),
    jsChunkCount: chunks.length,
    jsChunkTotalKb,
    topChunks: chunks.slice(0, 8),
    shellVisibleDuringSpinner: shellDuringSpinner,
    recordedAt: new Date().toISOString(),
  };
}

export function summarizeChunks(samples: TabWaitSample[]): ChunkResource[] {
  const map = new Map<string, ChunkResource>();
  for (const s of samples) {
    for (const c of s.topChunks) {
      const prev = map.get(c.url);
      if (!prev || c.transferSize > prev.transferSize) {
        map.set(c.url, c);
      }
    }
  }
  return [...map.values()].sort((a, b) => b.transferSize - a.transferSize);
}
