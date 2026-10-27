#!/usr/bin/env node
/**
 * scripts/gen-boot-mark-data.mjs
 *
 * public/boot-splash.png（起動画面の絵）の data URI が
 * theme/tokens/boot-splash-data.ts と一致しているかを検査する。
 * 生成本体は scripts/compose-boot-splash.py（Pillow。外部の画像サービスは使わない）。
 *
 * ■ なぜ要るか（2026-10-12）
 *   実機の起動録画 10 回中 4 回、OS の起動画面 → ベールの切り替わり（約3.2秒）でアイコンが 15〜109ms 消えていた。
 *   ベールの最初の描画に、マーク画像（外部ファイル）が間に合っていない。
 *   <head> の静的 preload（media 付き）を試したが、欠けの頻度は変わらなかった（4/10 → 4/10）ので戻した。
 *   外部ファイルの取得を待たないよう、画像をページ（HTML の CSS）に直接埋め込む。
 *
 * ■ 費用（承知の上）
 *   data URI は HTML に入るので、★全訪問者の HTML が約 31KB 増える（base64 は圧縮が効かない）。
 *   以前の設計は「通常訪問で 27KB を取りに行かない」ために背景画像（外部ファイル）にしていた。
 *   だから「実機で欠けが目に見えて減ること」を `pnpm qa:android-launch --runs 10` で確かめてから残す。
 *   減らなければ戻す（このファイルと theme/tokens/boot-mark-data.ts を消し、+html.tsx を BOOT.markSrc に戻す）。
 *
 * ■ 形式の選定（実測）
 *   元の PNG は 8bit パレット（27.6KB）で、絵の細部（グラデーション・細い線）が多い。
 *   WebP 520px q60 = 約 24.6KB が見た目の差が最小（元画像との平均差 2.6/255）。
 *   128 色の PNG は 13.8KB と軽いが、頬のグラデーションが平らな円になる（目視で確認）ので不採用。
 *
 * ■ 使い方
 *   node scripts/gen-boot-mark-data.mjs            # 生成して書き出す（boot-mark.png を変えたとき）
 *   node scripts/gen-boot-mark-data.mjs --verify   # 書き出さず、埋め込みが今の PNG と同期しているかだけ検査（pnpm check）
 *
 * 終了コード: 0=同期している/生成した / 1=同期していない（--verify）/ 2=測れなかった（sharp が無い等）
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PNG = join(ROOT, "public", "boot-splash.png");
const OUT = join(ROOT, "theme", "tokens", "boot-splash-data.ts");
const verify = process.argv.includes("--verify");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

if (!existsSync(PNG)) {
  console.error(`🟡 測れなかった: ${PNG} が無い`);
  process.exit(2);
}
const png = readFileSync(PNG);
const pngSha = sha256(png);

if (verify) {
  if (!existsSync(OUT)) {
    console.error("🔴 theme/tokens/boot-splash-data.ts が無い。`node scripts/gen-boot-mark-data.mjs` で生成してください");
    process.exit(1);
  }
  const m = readFileSync(OUT, "utf8").match(/BOOT_SPLASH_SOURCE_SHA256\s*=\s*"([0-9a-f]{64})"/);
  if (!m) {
    console.error("🔴 boot-splash-data.ts から SHA256 が読めない（手で編集していませんか）");
    process.exit(1);
  }
  if (m[1] !== pngSha) {
    console.error(
      "🔴 public/boot-splash.png が変わったのに、埋め込み（theme/tokens/boot-splash-data.ts）が古いまま。\n" +
        "   直し方: node scripts/gen-boot-mark-data.mjs\n" +
        "   ★この検査が判定しないこと: 埋め込み画像の見た目の品質（PNG のハッシュの一致だけ見る）",
    );
    process.exit(1);
  }
  console.log("[gen-boot-mark-data] ✅ 埋め込みは public/boot-splash.png と同期している");
  process.exit(0);
}

// 生成は Python（Pillow）側。sharp が無くても同じ結果になる。
execFileSync("python3", ["scripts/compose-boot-splash.py", "--data-only"], {
  cwd: ROOT,
  stdio: "inherit",
});
process.exit(0);
