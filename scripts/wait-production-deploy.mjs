#!/usr/bin/env node
/**
 * 本番デプロイ完了待ち — version.json の SHA 一致 + entry chunk が JS として配信されること。
 * CI: EXPECTED_SHA=<git sha> node scripts/wait-production-deploy.mjs
 */
const BASE = process.env.PRODUCTION_URL ?? "https://surechigai.kimito.link";
const EXPECTED = process.env.EXPECTED_SHA ?? "";
const MAX_ATTEMPTS = Number(process.env.DEPLOY_WAIT_ATTEMPTS ?? 40);
const INTERVAL_MS = Number(process.env.DEPLOY_WAIT_INTERVAL_MS ?? 10_000);
const SETTLE_MS = Number(process.env.DEPLOY_SETTLE_MS ?? 20_000);

async function fetchJson(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function extractEntryScript(html) {
  const match = html.match(/\/_expo\/static\/js\/web\/entry-[^"']+\.js[^"']*/);
  return match?.[0] ?? null;
}

async function verifyEntryChunk(entryPath) {
  const url = `${BASE}${entryPath.startsWith("/") ? entryPath : `/${entryPath}`}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return { ok: false, reason: `entry ${res.status}` };
  const ct = res.headers.get("content-type") ?? "";
  if (!/javascript|ecmascript/i.test(ct)) {
    const snippet = (await res.text()).slice(0, 80);
    return { ok: false, reason: `entry MIME=${ct} body=${snippet}` };
  }
  return { ok: true };
}

async function main() {
  if (!EXPECTED) {
    console.warn("EXPECTED_SHA unset — skipping deploy wait");
    return;
  }

  console.log(`Waiting for ${BASE} commitSha=${EXPECTED}`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const version = await fetchJson(`${BASE}/version.json`);
      const actual = version.commitSha ?? "";
      console.log(`attempt ${attempt}/${MAX_ATTEMPTS}: version.json=${actual}`);

      if (actual !== EXPECTED) {
        await sleep(INTERVAL_MS);
        continue;
      }

      const html = await fetchText(`${BASE}/`);
      const entry = extractEntryScript(html);
      if (!entry) {
        console.log("entry script not found in HTML yet");
        await sleep(INTERVAL_MS);
        continue;
      }

      const chunk = await verifyEntryChunk(entry);
      if (!chunk.ok) {
        console.log(`chunk check failed: ${chunk.reason}`);
        await sleep(INTERVAL_MS);
        continue;
      }

      console.log(`Deploy ready (entry OK). Settling ${SETTLE_MS}ms for CDN…`);
      await sleep(SETTLE_MS);
      console.log("Deploy verified");
      return;
    } catch (err) {
      console.log(`attempt ${attempt} error: ${err instanceof Error ? err.message : err}`);
      await sleep(INTERVAL_MS);
    }
  }

  console.warn("Deploy wait timed out — proceeding anyway (E2E may flake)");
  process.exitCode = 0;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main();
