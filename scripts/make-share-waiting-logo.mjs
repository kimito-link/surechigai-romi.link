// 待機画面(about:blank)に埋め込むロゴを data URI 化する。
// about:blank は外部リソースを読めないため、画像は文字列として埋めるしかない。
// 小さく作ることが最優先（HTMLごと innerHTML に流し込むので、重いと表示が遅れる）。
import sharp from "sharp";
import fs from "node:fs";

const SRC = "assets/images/logos/kimitolink-logo.webp";
const OUT = "lib/share-waiting-logo.ts";

const meta = await sharp(SRC).metadata();
console.log("source:", meta.width + "x" + meta.height, meta.format);

// 表示は最大 132px 幅。Retina を考えて 2倍の 264px で焼く。
const png = await sharp(SRC)
  .resize({ width: 264, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, quality: 88 })
  .toBuffer();

console.log("encoded png:", (png.length / 1024).toFixed(1), "KB");

const b64 = png.toString("base64");
const dataUri = `data:image/png;base64,${b64}`;
console.log("data uri length:", (dataUri.length / 1024).toFixed(1), "KB");

const body = `/**
 * 待機画面に埋め込む君斗りんくのロゴ（data URI）。
 *
 * なぜ data URI なのか:
 *   待機画面は about:blank に innerHTML で流し込むため、外部リソース(画像URL)を
 *   参照できない（lib/share-waiting-screen.ts の制約1）。画像は文字列として
 *   埋め込むしかない。
 *
 * 生成元: ${SRC}（幅 264px = 表示 132px の2倍 / Retina 対応）
 * このファイルは scripts/make-share-waiting-logo.mjs で再生成できる。
 * ロゴを差し替えたら再生成すること（手で base64 を書き換えない）。
 */
export const SHARE_WAITING_LOGO_DATA_URI =
  "${dataUri}";
`;

fs.writeFileSync(OUT, body);
console.log("wrote:", OUT, (fs.statSync(OUT).size / 1024).toFixed(1), "KB");
