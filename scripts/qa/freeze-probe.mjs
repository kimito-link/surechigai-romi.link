/**
 * freeze-probe.mjs — ローカル本番ビルドの「凍結」（メインスレッド無限占有）調査ツール
 *
 * 2026-07-04 の本番全面凍結OOM障害調査（docs/investigation/auth-home-oom-root-cause.md）で
 * 使った使い捨てスクリプト群（.tmp-freeze-probe*.mjs / .tmp-static-server.mjs /
 * .tmp-verify-fix2.mjs / .tmp-symbolicate.mjs）を1本の恒久ツールに整理したもの。
 * 同種の「凍結」（fetch/setTimeout/CDP evaluate が全て無応答になる無限 sync レンダリング等）が
 * 再発した際に、都度使い捨てスクリプトを書き直さず再利用する。
 *
 * サブコマンド:
 *   serve        <dist-dir> [--port=8788]
 *     ローカル本番ビルド（`npx expo export`）を静的配信する。拡張子なしパスは
 *     `<path>.html` に解決してから index.html にフォールバックする expo export 用サーバー。
 *
 *   check <path> [--base-url=http://localhost:8788] [--timeout-sec=20]
 *     指定パスを開き、page.evaluate("1") が 1.5秒×2連続で無応答なら「凍結」と判定する。
 *     凍結時は CDP Debugger.pause で凍結中のコールスタックを最大3サンプル採取し、
 *     --stack-out（既定 qa-results/freeze-probe/stack.json）に保存する。
 *
 *   verify <path...> [--base-url=...]
 *     複数パスを順に check し、FROZE/OK を一覧表示する（修正の横断確認用）。
 *
 *   symbolicate [--stack=qa-results/freeze-probe/stack.json] --maps-dir=<dist>/_expo/static/js/web
 *     check/verify が保存したコールスタックJSONを、対応する .map（ソースマップ付き
 *     ローカルビルド: `npx expo export --source-maps`）でシンボリケートして表示する。
 *
 * 使い方の例:
 *   npx expo export --source-maps --output-dir .tmp-oom-dist
 *   pnpm qa:freeze-probe serve .tmp-oom-dist --port=8788 &
 *   pnpm qa:freeze-probe verify /checkin / /zukan /mypage /events
 *   pnpm qa:freeze-probe symbolicate --maps-dir=.tmp-oom-dist/_expo/static/js/web
 */

import http from "node:http";
import { readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  return fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);
const positionals = process.argv.slice(3).filter((a) => !a.startsWith("--"));

const OUT_DIR = path.join(ROOT, "qa-results", "freeze-probe");

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// ---------- serve ----------
async function cmdServe() {
  const distDir = positionals[0];
  if (!distDir) {
    console.error("使い方: qa:freeze-probe serve <dist-dir> [--port=8788]");
    process.exit(1);
  }
  const root = path.resolve(ROOT, distDir);
  const port = Number(arg("port", "8788"));
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".map": "application/json",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };
  http
    .createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p.endsWith("/")) p += "index";
      const candidates = path.extname(p) ? [p] : [p + ".html", p, "/index.html"];
      for (const c of candidates) {
        try {
          const data = await readFile(path.join(root, c));
          res.writeHead(200, { "content-type": types[path.extname(c)] || "application/octet-stream" });
          res.end(data);
          return;
        } catch {}
      }
      res.writeHead(404);
      res.end("not found");
    })
    .listen(port, () => console.log(`serving ${root} on :${port}`));
}

// ---------- check (凍結判定 + CDP スタック採取) ----------
async function checkOne(page, cdp, scriptUrls, baseUrl, targetPath, timeoutSec) {
  const reqs = [];
  const onRequest = (r) => {
    const u = r.url();
    if (/ttf|font|assets/i.test(u)) reqs.push(u.slice(-80));
  };
  const onFailed = (r) => reqs.push("FAILED " + r.url().slice(-80));
  page.on("request", onRequest);
  page.on("requestfailed", onFailed);

  await page.goto(baseUrl + targetPath, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => {});

  const t0 = Date.now();
  let misses = 0;
  let froze = false;
  while (Date.now() - t0 < timeoutSec * 1000) {
    const ok = await Promise.race([
      page.evaluate("1").then(() => true).catch(() => true),
      new Promise((r) => setTimeout(() => r(false), 1500)),
    ]);
    if (ok) {
      misses = 0;
    } else if (++misses >= 2) {
      froze = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 700));
  }

  page.off("request", onRequest);
  page.off("requestfailed", onFailed);

  let info = "";
  if (!froze) {
    info = await page
      .evaluate(`(() => {
        const m = performance.memory;
        return 'heapMB=' + (m ? Math.round(m.usedJSHeapSize/1048576) : '?') + ' dom=' + document.querySelectorAll('*').length;
      })()`)
      .catch(() => "eval-err");
  }

  const samples = [];
  if (froze && cdp) {
    let frames = null;
    const onPaused = (ev) => {
      frames = ev.callFrames;
    };
    cdp.on("Debugger.paused", onPaused);
    for (let s = 0; s < 3; s++) {
      frames = null;
      await cdp.send("Debugger.pause").catch(() => {});
      for (let i = 0; i < 8 && !frames; i++) await new Promise((r) => setTimeout(r, 500));
      if (frames) {
        samples.push(
          frames.slice(0, 12).map((f) => ({
            fn: f.functionName || "(anon)",
            url: (scriptUrls.get(f.location.scriptId) || "?").split("/").pop().split("?")[0],
            line: f.location.lineNumber,
            col: f.location.columnNumber,
          })),
        );
        await cdp.send("Debugger.resume").catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    cdp.off("Debugger.paused", onPaused);
  }

  return { path: targetPath, froze, info, fontReqs: reqs.slice(0, 12), samples };
}

async function withBrowser(fn) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Debugger.enable");
  const scriptUrls = new Map();
  cdp.on("Debugger.scriptParsed", (ev) => {
    if (ev.url) scriptUrls.set(ev.scriptId, ev.url);
  });
  try {
    return await fn({ browser, page, cdp, scriptUrls });
  } finally {
    await browser.close();
  }
}

async function cmdCheck() {
  const targetPath = positionals[0] ?? "/";
  const baseUrl = arg("base-url", "http://localhost:8788");
  const timeoutSec = Number(arg("timeout-sec", "20"));
  const stackOut = arg("stack-out", path.join(OUT_DIR, "stack.json"));

  ensureOutDir();
  const result = await withBrowser(({ page, cdp, scriptUrls }) =>
    checkOne(page, cdp, scriptUrls, baseUrl, targetPath, timeoutSec),
  );

  console.log(`${result.path.padEnd(12)} ${result.froze ? "FROZE" : "OK"}  ${result.info}`);
  if (result.fontReqs.length) console.log("font/asset requests: " + JSON.stringify(result.fontReqs));
  if (result.samples.length) {
    fs.mkdirSync(path.dirname(stackOut), { recursive: true });
    fs.writeFileSync(stackOut, JSON.stringify(result.samples, null, 2));
    console.log(`captured ${result.samples.length} call-stack samples -> ${path.relative(ROOT, stackOut)}`);
  }
  process.exit(result.froze ? 1 : 0);
}

// ---------- verify (複数パス横断) ----------
async function cmdVerify() {
  const paths = positionals.length ? positionals : ["/"];
  const baseUrl = arg("base-url", "http://localhost:8788");
  const timeoutSec = Number(arg("timeout-sec", "18"));

  const results = await withBrowser(async ({ page, cdp, scriptUrls }) => {
    const out = [];
    for (const p of paths) {
      out.push(await checkOne(page, cdp, scriptUrls, baseUrl, p, timeoutSec));
    }
    return out;
  });

  for (const r of results) {
    console.log(`${r.path.padEnd(12)} ${r.froze ? "FROZE" : "OK  "}  ${r.info}`);
  }
  const anyFrozen = results.some((r) => r.froze);
  process.exit(anyFrozen ? 1 : 0);
}

// ---------- symbolicate ----------
async function cmdSymbolicate() {
  const { TraceMap, originalPositionFor } = await import("@jridgewell/trace-mapping");
  const stackPath = arg("stack", path.join(OUT_DIR, "stack.json"));
  const mapsDir = arg("maps-dir", null);
  if (!mapsDir) {
    console.error("使い方: qa:freeze-probe symbolicate --maps-dir=<dist>/_expo/static/js/web [--stack=...]");
    process.exit(1);
  }
  const samples = JSON.parse(fs.readFileSync(stackPath, "utf8"));
  const maps = new Map();
  function getMap(file) {
    if (!maps.has(file)) {
      try {
        maps.set(file, new TraceMap(JSON.parse(fs.readFileSync(path.join(ROOT, mapsDir, `${file}.map`), "utf8"))));
      } catch {
        maps.set(file, null);
      }
    }
    return maps.get(file);
  }
  for (let s = 0; s < samples.length; s++) {
    console.log(`=== sample ${s} ===`);
    for (const f of samples[s]) {
      const file = String(f.url).split("?")[0];
      const tm = getMap(file);
      if (!tm) {
        console.log(`  ${f.fn} @ ${file} (no map)`);
        continue;
      }
      const pos = originalPositionFor(tm, { line: f.line + 1, column: f.col });
      const src = (pos.source || "?").replace(/^.*?(node_modules|components|lib|hooks|app|modules|features)/, "$1");
      console.log(`  ${f.fn} -> ${pos.name || "?"} @ ${src}:${pos.line}:${pos.column}`);
    }
  }
}

// ---------- entry ----------
const sub = process.argv[2];
switch (sub) {
  case "serve":
    await cmdServe();
    break;
  case "check":
    await cmdCheck();
    break;
  case "verify":
    await cmdVerify();
    break;
  case "symbolicate":
    await cmdSymbolicate();
    break;
  default:
    console.error(
      [
        "使い方: pnpm qa:freeze-probe <serve|check|verify|symbolicate> [args]",
        "  serve <dist-dir> [--port=8788]",
        "  check <path> [--base-url=http://localhost:8788] [--timeout-sec=20]",
        "  verify <path...> [--base-url=http://localhost:8788]",
        "  symbolicate --maps-dir=<dist>/_expo/static/js/web [--stack=qa-results/freeze-probe/stack.json]",
      ].join("\n"),
    );
    process.exit(1);
}
