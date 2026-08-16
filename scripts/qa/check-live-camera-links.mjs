#!/usr/bin/env node
/**
 * scripts/qa/check-live-camera-links.mjs
 *
 * ライブカメラの外部リンクが「本当に開けるか」を実測する。
 *
 * ★2026-08-16 に必要になった理由:
 * 近畿地方整備局のURLが /err/index.html へ302リダイレクトされており、
 * 大阪・京都・兵庫を含む7府県で**押すとエラーページが開く**状態だった。
 * ホワイトリスト通過・HTTP 200(リダイレクト後)なので、型もテストも lint も素通りする。
 * リンク先は外部サイトの都合で静かに壊れるため、定期的に実測するしかない。
 *
 * 判定:
 *   - 最終ステータスが 200 以外        → NG
 *   - エラーページへリダイレクトされた  → NG（/err/ 等を含む最終URL）
 *   - リダイレクト自体は許容（正常な移設もあるため最終URLで判断する）
 *
 * 使い方: node scripts/qa/check-live-camera-links.mjs
 * CI で毎回叩くと外部サイトへ負荷をかけるので、リリース前や気づいたときに手で回す。
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = resolve(ROOT, "lib/live-camera/live-camera-links.ts");

/** エラーページに飛ばされたと判断する最終URLのパターン */
const ERROR_PATTERNS = [/\/err\//i, /\/error/i, /notfound/i, /404/];

function extractLinks() {
  const src = readFileSync(SRC, "utf8");
  const links = [];
  // const <name>: LiveCameraLink = { url: "...", label: "..." }
  const re = /const\s+(\w+):\s*LiveCameraLink\s*=\s*\{[\s\S]*?url:\s*"([^"]+)"[\s\S]*?label:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    links.push({ key: m[1], url: m[2], label: m[3] });
  }
  return links;
}

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    return { status: res.status, finalUrl: res.url };
  } catch (e) {
    return { status: 0, finalUrl: "", error: String(e?.message ?? e) };
  }
}

const links = extractLinks();
if (links.length === 0) {
  console.error("[live-camera] リンクを1件も抽出できませんでした。正規表現が実装とズレています");
  process.exit(1);
}

console.log(`[live-camera] ${links.length} 件のリンクを実測します\n`);

const failures = [];
for (const { key, url, label } of links) {
  const { status, finalUrl, error } = await probe(url);
  const redirected = finalUrl && finalUrl !== url;
  const looksError = ERROR_PATTERNS.some((re) => re.test(finalUrl));
  const ok = status === 200 && !looksError;

  const mark = ok ? "OK  " : "NG  ";
  console.log(`${mark}${status || "---"}  ${key.padEnd(9)} ${url}`);
  if (redirected) console.log(`          └→ ${finalUrl}`);
  if (error) console.log(`          └→ ${error}`);

  if (!ok) failures.push({ key, url, finalUrl, status, label });
}

console.log("");
if (failures.length > 0) {
  console.error(`[live-camera] ${failures.length} 件が開けません:`);
  for (const f of failures) {
    console.error(`  - ${f.label} (${f.key}): ${f.url}`);
    if (f.finalUrl && f.finalUrl !== f.url) console.error(`      最終URL: ${f.finalUrl}`);
  }
  console.error("\n押すとエラーページが開く状態です。URLを差し替えるか、その地方を導線から外してください。");
  process.exit(1);
}

console.log("[live-camera] すべてのリンクが開けます。");
