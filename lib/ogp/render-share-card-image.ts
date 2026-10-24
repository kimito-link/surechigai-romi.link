/**
 * 1200x630 の共有カードをその場で描く。
 * 地図タイルも外部フォントAPIも叩かない。渡されるのは公開ラベル（都道府県+市区町村）だけ。
 * 失敗したら null。呼び出し側が都道府県の静的画像に落とす。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAsync } from "@resvg/resvg-js";
import sharp from "sharp";
import type { ShareCardImage, ShareCardRenderInput } from "./create-share-card.js";
import { SHARE_CARD_MAX_IMAGE_BYTES } from "./create-share-card.js";

const FONT_PATH = join(dirname(fileURLToPath(import.meta.url)), "fonts", "NotoSansJP-Bold.ttf");
/** この woff の name テーブル上のファミリー名（Noto Sans JP の 700 インスタンス）。 */
const FONT_FAMILY = "Noto Sans JP Thin";
const WIDTH = 1200;
const HEIGHT = 630;
const RENDER_TIMEOUT_MS = 2500;

function escXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    return "&apos;";
  });
}

function placeFontSize(label: string): number {
  if (label.length >= 16) return 52;
  if (label.length >= 12) return 64;
  if (label.length >= 9) return 76;
  return 88;
}

export function buildShareCardSvg(label: string | null): string {
  const place = escXml(label && label.trim() ? label.trim() : "日本のどこか");
  const size = placeFontSize(label && label.trim() ? label.trim() : "日本のどこか");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#00427B"/>
  <rect x="0" y="0" width="18" height="${HEIGHT}" fill="#E3C268"/>
  <text x="72" y="150" fill="#E3C268" font-size="36" font-family="${FONT_FAMILY}" font-weight="700">君斗りんくのすれ違ひ通信</text>
  <text x="72" y="340" fill="#FFFFFF" font-size="${size}" font-family="${FONT_FAMILY}" font-weight="700">${place}</text>
  <text x="72" y="430" fill="#FFFFFF" font-size="44" font-family="${FONT_FAMILY}" font-weight="700">にいるよ</text>
  <text x="72" y="560" fill="#D6E4F0" font-size="32" font-family="${FONT_FAMILY}" font-weight="700">キミの現在地を刻む</text>
</svg>`;
}

async function compressPng(png: Uint8Array): Promise<ShareCardImage | null> {
  let quality = 72;
  let jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
  while (jpeg.length > SHARE_CARD_MAX_IMAGE_BYTES && quality > 35) {
    quality -= 8;
    jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  if (jpeg.length > SHARE_CARD_MAX_IMAGE_BYTES) return null;
  return { body: jpeg, contentType: "image/jpeg" };
}

let fontReady = false;

function assertBundledFont(): void {
  if (fontReady) return;
  // フォントファイルを関数バンドルの追跡対象にする（中身は resvg がパスから読む）。
  readFileSync(FONT_PATH);
  fontReady = true;
}

export async function renderShareCardImage(
  input: ShareCardRenderInput,
): Promise<ShareCardImage | null> {
  try {
    assertBundledFont();
    const svg = buildShareCardSvg(input.label);
    const rendered = await renderAsync(
      svg,
      {
        font: {
          fontFiles: [FONT_PATH],
          loadSystemFonts: false,
          defaultFontFamily: FONT_FAMILY,
          sansSerifFamily: FONT_FAMILY,
        },
        fitTo: { mode: "width", value: WIDTH },
        background: "#00427B",
        textRendering: 1,
      },
      AbortSignal.timeout(RENDER_TIMEOUT_MS),
    );
    return await compressPng(rendered.asPng());
  } catch {
    return null;
  }
}
