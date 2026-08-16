#!/usr/bin/env node
/**
 * scripts/sync-splash-spec.mjs
 *
 * iOS PWA スプラッシュの「解像度表」を公式仕様から取り込み直す。
 *
 * ★なぜ必要か（2026-08-16）:
 * apple-touch-startup-image は **解像度が完全一致しないと iOS に無視される**。
 * この表を手で維持していたため公式20解像度のうち9件しか無く、
 * iPhone 16/17 Pro Max などでスプラッシュが一度も出ていなかった（実機録画で確認）。
 * 機種が出るたびに穴が空くので、Apple の仕様を追っている既存ツールに寄せる。
 *
 * 取り込み元: pwa-asset-generator (elegantapp) の apple-fallback-data.json。
 * 同ツールは Apple Human Interface Guidelines を毎日監視して更新している。
 * 実行時に依存させたくないので、データだけを取り込んで
 * scripts/data/ios-launch-sizes.json に正本として置く（画像生成は Python 側）。
 *
 * 使い方:
 *   pnpm splash:sync     # 表を更新（新機種が出たらこれを実行）
 *   pnpm brand:icons     # 更新後の表で画像を生成し直す
 *
 * 更新後は app/+html.tsx の link タグも作り直す必要がある。
 * そちらは同スクリプトが行う（--write-html、既定で実行）。
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = resolve(ROOT, "scripts/data/ios-launch-sizes.json");
const HTML = resolve(ROOT, "app/+html.tsx");

const BEGIN = "{/* SPLASH-LINKS:BEGIN — 自動生成。手で編集しない（pnpm splash:sync で再生成） */}";
const END = "{/* SPLASH-LINKS:END */}";

/**
 * pwa-asset-generator の仕様データを取り出す。
 *
 * Windows で `node -e "..."` をそのまま渡すとクォートが壊れるため、
 * プローブを一時ファイルに書いてから実行する（Git Bash / PowerShell 双方で通る）。
 */
function loadAppleSpec() {
  /* npx はパッケージの bin を優先してしまい `node <file>` に渡らない。
     取得と実行を分け、キャッシュに落ちた実体を自前の node で読む。 */
  const cacheDir = resolve(ROOT, "node_modules/.cache/splash-spec");
  mkdirSync(cacheDir, { recursive: true });
  execSync(
    `npm pack pwa-asset-generator@latest --pack-destination ${JSON.stringify(cacheDir)}`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], cwd: ROOT },
  );
  const tgz = readdirSync(cacheDir).filter((f) => f.endsWith(".tgz")).sort().pop();
  if (!tgz) throw new Error("pwa-asset-generator の取得に失敗しました");
  /* Windows の tar は絶対パス(C:\...)の -C を嫌うので、cwd を移して相対で扱う。 */
  execSync(`tar -xzf ${JSON.stringify(tgz)}`, {
    cwd: cacheDir,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const dataPath = resolve(cacheDir, "package/dist/config/apple-fallback-data.json");
  if (!existsSync(dataPath)) {
    throw new Error(`仕様データが見つかりません: ${dataPath}`);
  }
  return JSON.parse(readFileSync(dataPath, "utf8"));
}

/** 縦向きの解像度だけを、重複を除いて px 昇順で返す */
function toPortraitTable(spec) {
  const seen = new Map();
  for (const e of spec) {
    const sf = e.scaleFactor;
    const w = e.portrait?.width;
    const h = e.portrait?.height;
    if (!w || !h || !sf) continue;
    const key = `${w}x${h}`;
    if (seen.has(key)) continue;
    seen.set(key, {
      px: [w, h],
      logical: [Math.round(w / sf), Math.round(h / sf)],
      dpr: sf,
      device: e.device ?? "",
    });
  }
  return [...seen.values()].sort((a, b) => a.px[0] - b.px[0] || a.px[1] - b.px[1]);
}

/** +html.tsx に差し込む link タグ群を作る */
function renderLinks(table) {
  const lines = table.map(({ px, logical, dpr, device }) => {
    const [lw, lh] = logical;
    const media =
      `(device-width: ${lw}px) and (device-height: ${lh}px) and ` +
      `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait), ` +
      `(device-width: ${lw}px) and (device-height: ${lh}px) and ` +
      `(resolution: ${dpr}dppx) and (orientation: portrait)`;
    return [
      `        {/* ${device} */}`,
      `        <link`,
      `          rel="apple-touch-startup-image"`,
      `          href="/splash/ios-${px[0]}x${px[1]}.png"`,
      `          media="${media}"`,
      `        />`,
    ].join("\n");
  });
  return lines.join("\n");
}

function main() {
  const table = toPortraitTable(loadAppleSpec());
  if (table.length < 15) {
    throw new Error(`仕様データが少なすぎます(${table.length}件)。取り込みに失敗した可能性`);
  }

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  const json = {
    _source:
      "pwa-asset-generator (elegantapp) apple-fallback-data.json — Apple Human Interface Guidelines 由来",
    _note: "縦向きのみ（manifest.orientation=portrait）。手で編集しない。更新は pnpm splash:sync。",
    _syncedAt: new Date().toISOString().slice(0, 10),
    portrait: table,
  };
  writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`[splash:sync] wrote scripts/data/ios-launch-sizes.json (${table.length} sizes)`);

  if (!existsSync(HTML)) throw new Error(`missing ${HTML}`);
  const src = readFileSync(HTML, "utf8");
  const b = src.indexOf(BEGIN);
  const e = src.indexOf(END);
  if (b === -1 || e === -1) {
    throw new Error(
      "app/+html.tsx に SPLASH-LINKS:BEGIN / END のマーカーがありません。" +
        "自動生成ブロックを消してしまった可能性があります。",
    );
  }
  const next = src.slice(0, b + BEGIN.length) + "\n" + renderLinks(table) + "\n" + src.slice(e);
  writeFileSync(HTML, next, "utf8");
  console.log(`[splash:sync] updated app/+html.tsx (${table.length} link tags)`);
  console.log("[splash:sync] 次に `pnpm brand:icons` で画像を生成してください");
}

main();
