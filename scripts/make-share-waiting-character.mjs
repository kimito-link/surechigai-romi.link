// 待機画面(about:blank)に埋め込むキャラクター（ゆっくりりんく）を data URI 化する。
// about:blank は外部リソースを読めないため、画像は文字列として埋めるしかない。
//
// ロゴ側（make-share-waiting-logo.mjs）と同じ方式。差し替えたら再生成すること。
import sharp from "sharp";
import fs from "node:fs";

const SRC = "assets/images/characters/link/link-yukkuri-smile-mouth-open.png";
const OUT = "lib/share-waiting-character.ts";

const meta = await sharp(SRC).metadata();
console.log("source:", meta.width + "x" + meta.height, meta.format);

// ファーストビューを覆う大きさで出すので、表示は最大 220px 幅。Retina で 2倍の 440px。
const png = await sharp(SRC)
  .resize({ width: 440, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, quality: 88 })
  .toBuffer();

console.log("encoded png:", (png.length / 1024).toFixed(1), "KB");

const b64 = png.toString("base64");
const dataUri = `data:image/png;base64,${b64}`;
console.log("data uri length:", (dataUri.length / 1024).toFixed(1), "KB");

const body = `/**
 * 待機画面に埋め込むゆっくりりんく（data URI）。
 *
 * なぜ data URI なのか:
 *   待機画面は about:blank に innerHTML で流し込むため、外部リソース(画像URL)を
 *   参照できない（lib/share-waiting-screen.ts の制約1）。
 *
 * 生成元: ${SRC}（幅 440px = 表示 220px の2倍 / Retina 対応）
 * このファイルは scripts/make-share-waiting-character.mjs で再生成できる。
 * 手で base64 を書き換えないこと。
 */
export const SHARE_WAITING_CHARACTER_DATA_URI =
  "${dataUri}";
`;

fs.writeFileSync(OUT, body);
console.log("wrote:", OUT);
