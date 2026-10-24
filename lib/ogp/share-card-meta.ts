/**
 * 凍結した共有カード /s/<id> のクローラー向けメタ。
 * DBも画像生成もここには置かない。タイトルと画像URLをHTMLにするだけ。
 */
import {
  ensureSafePublicImageUrl,
  prefectureCode,
  prefectureNameByCode,
  sanitizePublicText,
  toPublicPlace,
} from "./sanitize-public-place.js";

export const APP_ORIGIN = "https://surechigai.kimito.link";

/** カードは不変なので、クローラーもCDNも長くキャッシュしてよい。 */
export const SHARE_CARD_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function shareCardResponseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": SHARE_CARD_CACHE_CONTROL,
    // 同じURLを人間は別レスポンス（302）で受ける。UAで分けないとCDNが取り違える。
    Vary: "User-Agent",
  };
}

export function isStaticShareCardId(id: string): boolean {
  return id === "default" || /^p(0[1-9]|[1-3][0-9]|4[0-7])$/.test(id);
}

export function staticShareCardId(prefecture: string | null | undefined): string {
  const code = prefectureCode(prefecture);
  return code ? `p${code}` : "default";
}

export function staticShareImageUrl(
  prefecture: string | null | undefined,
  origin = APP_ORIGIN,
): string {
  const code = prefectureCode(prefecture);
  if (!code) return `${origin}/og-default.png`;
  return `${origin}/og/prefectures/${code}.jpg`;
}

export type ShareCardMetaInput = {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  fallbackImageUrl?: string;
};

export function buildShareCardDescription(areaText: string | null | undefined): string {
  const place = toPublicPlace({
    address: areaText,
    area: areaText,
    prefecture: areaText,
  }).label;
  const where = place ?? "どこか";
  return `${where}で記録された足あと。キミの現在地を刻もう。`;
}

export function buildShareCardTitle(handle: string | null, label: string | null): string {
  const place = label ?? "どこか";
  const who = handle ? `@${handle} は ` : "";
  return sanitizePublicText(`${who}${place}にいるよ｜君斗りんくのすれ違ひ通信`);
}

export function staticShareCardView(id: string, origin = APP_ORIGIN): ShareCardMetaInput {
  const safeId = isStaticShareCardId(id) ? id : "default";
  if (safeId === "default") {
    return {
      title: "君斗りんくのすれ違ひ通信｜キミの現在地を刻む",
      description: "位置情報で近くにいた人とすれ違える、無料のすれ違ひ通信。キミの現在地を刻もう。",
      imageUrl: `${origin}/og-default.png`,
      pageUrl: `${origin}/s/default`,
    };
  }
  const name = prefectureNameByCode(safeId.slice(1)) ?? "どこか";
  return {
    title: buildShareCardTitle(null, name),
    description: buildShareCardDescription(name),
    imageUrl: staticShareImageUrl(name, origin),
    pageUrl: `${origin}/s/${safeId}`,
  };
}

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escUrlAttr(url: string): string {
  return url.replace(/"/g, "&quot;");
}

function imageContentType(url: string): string {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/png";
}

function safePageUrl(url: string, origin: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return `${origin}/s/default`;
    const decoded = decodeURIComponent(`${parsed.pathname}${parsed.search}`);
    if (/丁目|番地|号室|号棟|〒|\d{3}-\d{4}/.test(decoded)) return `${origin}/s/default`;
    parsed.searchParams.delete("lat");
    parsed.searchParams.delete("lng");
    parsed.searchParams.delete("zoom");
    return parsed.toString();
  } catch {
    return `${origin}/s/default`;
  }
}

/** クローラーに返すメタHTML。番地・郵便番号・細かい座標はここに残さない。 */
export function buildShareCardMetaHtml(input: ShareCardMetaInput, origin = APP_ORIGIN): string {
  const title = sanitizePublicText(input.title);
  const description = sanitizePublicText(input.description);
  const fallback = input.fallbackImageUrl ?? `${origin}/og-default.png`;
  const imageUrl = ensureSafePublicImageUrl(input.imageUrl, fallback);
  const pageUrl = safePageUrl(input.pageUrl, origin);
  const imageType = imageContentType(imageUrl);
  const imageAlt = title.replace(/｜.*$/, "").trim();

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(description)}" />
<link rel="canonical" href="${escUrlAttr(pageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="君斗りんくのすれ違ひ通信" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(description)}" />
<meta property="og:url" content="${escUrlAttr(pageUrl)}" />
<meta property="og:image" content="${escUrlAttr(imageUrl)}" />
<meta property="og:image:secure_url" content="${escUrlAttr(imageUrl)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="${imageType}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escHtml(title)}" />
<meta name="twitter:description" content="${escHtml(description)}" />
<meta name="twitter:image" content="${escUrlAttr(imageUrl)}" />
<meta name="twitter:image:alt" content="${escHtml(imageAlt)}" />
</head>
<body></body>
</html>`;
}
