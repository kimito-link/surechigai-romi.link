#!/usr/bin/env node
/**
 * タブ遷移待ち調査 — 本番 JS chunk サイズプローブ（読み取り専用 GET）
 *
 * Usage:
 *   node scripts/tab-wait-probe.mjs
 *   BASE_URL=https://surechigai.kimito.link node scripts/tab-wait-probe.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BASE_URL = (process.env.BASE_URL ?? "https://surechigai.kimito.link").replace(/\/$/, "");
const ROUTES = ["/", "/checkin", "/events", "/zukan", "/map", "/mypage"];
const OUT_DIR = path.resolve("docs/investigation/artifacts");

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function getSize(url) {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    const len = head.headers.get("content-length");
    if (len) return Number(len);
  } catch {
    /* fall through to GET */
  }
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength;
  } catch {
    return null;
  }
}

function extractScriptSrcs(html, base) {
  const srcs = new Set();
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const src = m[1];
    if (src.startsWith("http")) srcs.add(src);
    else srcs.add(new URL(src, base).href);
  }
  return [...srcs];
}

async function probeRoute(route) {
  const url = `${BASE_URL}${route === "/" ? "/" : route}`;
  const html = await fetchText(url);
  const scripts = extractScriptSrcs(html, url);
  const sized = [];
  for (const s of scripts) {
    if (!/\.js(\?|$)/.test(s)) continue;
    const bytes = await getSize(s);
    sized.push({
      url: s.replace(BASE_URL, ""),
      file: s.split("/").pop()?.slice(0, 100) ?? s,
      bytes: bytes ?? 0,
      kb: bytes ? Math.round(bytes / 1024) : null,
    });
  }
  sized.sort((a, b) => b.bytes - a.bytes);
  return { route, scriptCount: scripts.length, jsChunks: sized, totalJsKb: Math.round(sized.reduce((n, x) => n + x.bytes, 0) / 1024) };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const version = await fetchText(`${BASE_URL}/version.json`).then(JSON.parse).catch(() => null);
  const routeResults = [];

  for (const route of ROUTES) {
    process.stderr.write(`probe ${route}...\n`);
    try {
      routeResults.push(await probeRoute(route));
    } catch (e) {
      routeResults.push({ route, error: String(e) });
    }
  }

  const chunkMap = new Map();
  for (const r of routeResults) {
    if (!r.jsChunks) continue;
    for (const c of r.jsChunks) {
      const prev = chunkMap.get(c.file);
      if (!prev || c.bytes > prev.bytes) chunkMap.set(c.file, { ...c, seenOn: [...(prev?.seenOn ?? []), r.route] });
      else prev.seenOn = [...new Set([...prev.seenOn, r.route])];
    }
  }

  const top5 = [...chunkMap.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 5);

  const payload = {
    baseUrl: BASE_URL,
    version,
    probedAt: new Date().toISOString(),
    routeResults,
    prefetchGapCandidates: [
      { module: "post-authenticated-screen", priority: "P0", reason: "route lazy 未 prefetch" },
      { module: "events-authenticated-screen", priority: "P0", reason: "route lazy 未 prefetch" },
      { module: "zukan-authenticated-screen", priority: "P0", reason: "route lazy 未 prefetch" },
      { module: "mypage-authenticated-screen", priority: "P1", reason: "route lazy 未 prefetch" },
      { module: "public-web-providers", priority: "P2", reason: "guest tRPC mount" },
    ],
    top5ChunksBySize: top5,
  };

  const outFile = path.join(OUT_DIR, "chunk-probe-production.json");
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outFile}`);
  console.log("Top 5 JS (GET byte length):");
  for (const c of top5) {
    console.log(`  ${c.kb ?? "?"} KB  ${c.file}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
