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
 *   pnpm splash:sync     # もう一度。画像を内容ハッシュ名へ改名し、link タグの href を書き出す
 *   pnpm splash:sync --verify   # 書き込まず、生成物が最新かだけ検査する（pnpm check に入っている）
 *
 * 更新後は app/+html.tsx の link タグも作り直す必要がある。
 * そちらは同スクリプトが行う（既定で実行）。
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * スプラッシュ画像のファイル名を**中身の sha256 先頭12桁**入りにする
 * （例: ios-1320x2868.3f9a1c07be52.png）。
 *
 * ★なぜ必要か（2026-08-22 実障害 SG-02 → 2026-10-05 に作り替え）:
 *   画像は以前 `/splash/ios-1179x2556.png` のように**名前が固定**で、
 *   Cloudflare が `max-age=31536000, immutable` で配信していた。
 *   そのため中身を差し替えても**古い画像が配られ続けた**。
 *   2026-08-21 に「濃紺の四角」を角丸化・拡大したのに、35時間後の本番で
 *   20解像度中5件が旧版のままだった（新旧が混在するので気づけない）。
 *
 *   当時は URL に `?v=2` を付けて別URLにしていたが、これはその場しのぎだった。
 *   クエリを CDN・ブラウザ・iOS がどう扱うかに依存し、本家 kimito.link の href にも無い。
 *   同じ系統の実損は doin（Expo の entry を内容ハッシュ名に改名して解決）でも出た。
 *   ＝ **中身が変われば名前が変わる**形にすれば、旧版が配られる余地そのものが無い。
 *
 * 流れ:
 *   pnpm brand:icons  → public/splash/ios-<w>x<h>.png（ハッシュ無し）を生成
 *   pnpm splash:sync  → 中身のハッシュ入りの名前へ改名し、link タグの href を書き出す
 *   （旧名・旧ハッシュのファイルは残さない＝dist に二重に入らない）
 *
 * ★ローカルの画像は正しくても、壊れているのが配信ということがある。
 *   本番から落として測ること（scripts/qa/check-splash-served.mjs）。
 */
const HASH_LEN = 12;
const SPLASH_DIR = resolve(ROOT, "public/splash");
const FALLBACK_STEM = "ios-fallback";
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

/** ファイル内容の sha256 先頭 HASH_LEN 桁 */
function contentHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, HASH_LEN);
}

/**
 * 1種類分の画像（stem 例: "ios-1320x2868"）を内容ハッシュ名に揃え、最終ファイル名を返す。
 *
 * - `<stem>.png`（brand:icons が作った直後のもの）があれば、それが最新。
 *   中身のハッシュ名へ改名し、同じ stem の旧ハッシュ付きファイルは消す。
 * - 無ければ、既にあるハッシュ付きファイルが1つだけのはず。名前と中身が合っているか確かめる。
 * - write=false（--verify）のときはファイルを動かさず、ずれを problems に積む。
 */
function settleSplashFile(stem, { write, problems }) {
  const files = existsSync(SPLASH_DIR) ? readdirSync(SPLASH_DIR) : [];
  const hashedRe = new RegExp(`^${stem}\\.[0-9a-f]{${HASH_LEN}}\\.png$`);
  const hashed = files.filter((f) => hashedRe.test(f));
  const freshName = `${stem}.png`;

  if (files.includes(freshName)) {
    const target = `${stem}.${contentHash(resolve(SPLASH_DIR, freshName))}.png`;
    if (!write) {
      problems.push(`public/splash/${freshName}（ハッシュ名へ未改名）`);
      return target;
    }
    if (hashed.includes(target)) unlinkSync(resolve(SPLASH_DIR, freshName));
    else renameSync(resolve(SPLASH_DIR, freshName), resolve(SPLASH_DIR, target));
    for (const f of hashed) if (f !== target) unlinkSync(resolve(SPLASH_DIR, f));
    return target;
  }

  if (hashed.length === 0) {
    const msg = `public/splash/${stem}.<hash>.png が無い（pnpm brand:icons で生成してください）`;
    if (write) throw new Error(msg);
    problems.push(msg);
    return `${stem}.${"0".repeat(HASH_LEN)}.png`;
  }
  if (hashed.length > 1) {
    const msg = `public/splash/ に ${stem} のハッシュ付きファイルが複数ある: ${hashed.join(", ")}`;
    if (write) throw new Error(msg);
    problems.push(msg);
    return hashed[0];
  }

  const actual = `${stem}.${contentHash(resolve(SPLASH_DIR, hashed[0]))}.png`;
  if (actual === hashed[0]) return actual;
  if (write) renameSync(resolve(SPLASH_DIR, hashed[0]), resolve(SPLASH_DIR, actual));
  else problems.push(`public/splash/${hashed[0]}（名前のハッシュが中身と一致しない）`);
  return actual;
}

/** +html.tsx に差し込む link タグ群を作る（fileOf: stem → 最終ファイル名） */
function renderLinks(table, fileOf) {
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
      `          href="/splash/${fileOf(`ios-${px[0]}x${px[1]}`)}"`,
      `          media="${media}"`,
      `        />`,
    ].join("\n");
  });
  /* フォールバック（media省略）: 新機種等で上のどの device-width/height にも一致しない場合の保険。
     画像を作り直せば名前も変わるので、同じ自動生成ブロックの中で書き出す。 */
  lines.push(
    [
      `        {/* フォールバック（media省略）: 未知の新機種の保険 */}`,
      `        <link rel="apple-touch-startup-image" href="/splash/${fileOf(FALLBACK_STEM)}" />`,
    ].join("\n"),
  );
  return lines.join("\n");
}

function main() {
  const table = toPortraitTable(loadAppleSpec());
  if (table.length < 15) {
    throw new Error(`仕様データが少なすぎます(${table.length}件)。取り込みに失敗した可能性`);
  }

  /* ★--verify を足した（2026-08-21）。
     それまでは引数なしで**必ず書き込む**ので、検査のつもりで叩くと作業ツリーが汚れた。
     しかも出力が LF 固定なのに実ファイルが CRLF のため、
     中身が同じでも 122 行が差分として出て**本物の変更が埋もれていた**。
     - 書き込み前に既存ファイルの改行コードへ合わせる（無意味な差分を出さない）
     - --verify では書き込まず、差分があれば非0で終了する */
  const verifyOnly = process.argv.includes("--verify");

  /** 既存ファイルの改行コードに合わせる（CRLF のファイルへ LF を書き込まない） */
  const matchEol = (text, existingPath) => {
    if (!existsSync(existingPath)) return text;
    const cur = readFileSync(existingPath, "utf8");
    const wantsCrlf = cur.includes("\r\n");
    const lf = text.replace(/\r\n/g, "\n");
    return wantsCrlf ? lf.replace(/\n/g, "\r\n") : lf;
  };

  const problems = [];

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  const json = {
    _source:
      "pwa-asset-generator (elegantapp) apple-fallback-data.json — Apple Human Interface Guidelines 由来",
    _note: "縦向きのみ（manifest.orientation=portrait）。手で編集しない。更新は pnpm splash:sync。",
    // ★_syncedAt は実行日なので毎回変わる。--verify の比較対象から外すため、
    //   既存ファイルがあればその値を引き継ぐ（内容が同じなら差分を出さない）。
    _syncedAt: (() => {
      if (existsSync(OUT_JSON)) {
        try {
          const prev = JSON.parse(readFileSync(OUT_JSON, "utf8"));
          const same =
            JSON.stringify(prev.portrait) === JSON.stringify(table);
          if (same && prev._syncedAt) return prev._syncedAt;
        } catch {
          /* 壊れていれば作り直す */
        }
      }
      return new Date().toISOString().slice(0, 10);
    })(),
    portrait: table,
  };
  const jsonText = matchEol(JSON.stringify(json, null, 2) + "\n", OUT_JSON);
  if (verifyOnly) {
    const cur = existsSync(OUT_JSON) ? readFileSync(OUT_JSON, "utf8") : "";
    if (cur !== jsonText) problems.push("scripts/data/ios-launch-sizes.json");
  } else {
    writeFileSync(OUT_JSON, jsonText, "utf8");
    console.log(`[splash:sync] wrote scripts/data/ios-launch-sizes.json (${table.length} sizes)`);
  }

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
  /* 画像を内容ハッシュ名へ揃えてから、その名前で link タグを書き出す */
  const resolved = new Map();
  for (const { px } of table) {
    const stem = `ios-${px[0]}x${px[1]}`;
    resolved.set(stem, settleSplashFile(stem, { write: !verifyOnly, problems }));
  }
  resolved.set(FALLBACK_STEM, settleSplashFile(FALLBACK_STEM, { write: !verifyOnly, problems }));
  const rebuilt =
    src.slice(0, b + BEGIN.length) +
    "\n" +
    renderLinks(table, (stem) => resolved.get(stem)) +
    "\n" +
    src.slice(e);
  const next = matchEol(rebuilt, HTML);
  if (verifyOnly) {
    if (src !== next) problems.push("app/+html.tsx");
  } else {
    writeFileSync(HTML, next, "utf8");
    console.log(`[splash:sync] updated app/+html.tsx (${table.length + 1} link tags, 内容ハッシュ名)`);
      }

  if (verifyOnly) {
    if (problems.length > 0) {
      console.error(`[splash:sync] NG: 生成物が最新ではありません → ${problems.join(", ")}`);
      console.error("  直し方: pnpm splash:sync を実行してコミットする");
      process.exit(1);
    }
    console.log(`[splash:sync] OK: 生成物は最新（${table.length} sizes）`);
  }
}

main();
