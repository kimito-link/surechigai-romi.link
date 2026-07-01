/**
 * api/u/[slug].ts
 *
 * 公開共有リンク /u/<slug> のクローラー向けメタHTMLを返す Vercel Function。
 * - slug から「最後の記録地点」を解決し、OGP/Twitter Card メタを生成。
 * - og:image は /api/og に座標・地名を渡した動的画像を指す。
 * - 人間のブラウザは Expo SPA の /u/<slug> 地図画面へ（middleware は bot のみ rewrite）。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../server/db/connection.js";
import { getShareInfoBySlug } from "../../modules/encounter/db/queries.js";
import {
  buildOgImageSearchParams,
  parseShareLocationFromQuery,
  preferExplicitShareLocation,
  resolveShareAreaLabel,
} from "../../lib/ogp/share-meta.js";

const ORIGIN = "https://surechigai.kimito.link";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  let title = "君斗りんくのすれ違ひ通信｜会いたい君がいる現在地";
  let description =
    "位置情報で近くにいた人とすれ違える、無料のすれ違い通信。会いたい君がいる現在地をたどろう。";
  const ogParams = new URLSearchParams();

  if (slug && /^[A-Za-z0-9]{1,16}$/.test(slug)) {
    try {
      const db = await getDb();
      if (db) {
        const info = await getShareInfoBySlug(db, slug, undefined, { ogpContext: true });
        const queryHint = parseShareLocationFromQuery(req.query);
        const location = preferExplicitShareLocation(
          info
            ? {
                area: info.area,
                prefecture: info.prefecture,
                lat: info.lat,
                lng: info.lng,
                hasLocation: info.hasLocation,
                zoom: info.zoom,
                recordedAt: info.recordedAt,
              }
            : null,
          queryHint,
        );

        if (info || location) {
          const who = info?.username ? `@${info.username}` : info?.name ?? "この人";
          const place =
            resolveShareAreaLabel(location) ??
            resolveShareAreaLabel(
              info
                ? {
                    area: info.area,
                    prefecture: info.prefecture,
                    lat: info.lat,
                    lng: info.lng,
                    hasLocation: info.hasLocation,
                    zoom: info.zoom,
                    recordedAt: info.recordedAt,
                  }
                : null,
            ) ??
            "どこか";
          title = `${who} は ${place} にいるよ｜君斗りんくのすれ違ひ通信`;
          description = `${place} で記録された足あと。会いたい君がいる現在地をたどろう。`;
          if (info?.username) ogParams.set("name", info.username);
          if (location) {
            const built = buildOgImageSearchParams(location);
            built.forEach((value, key) => ogParams.set(key, value));
          }
        }
      }
    } catch {
      // 解決失敗時は汎用メタにフォールバック
    }
  }

  const ogImage = `${ORIGIN}/api/og${
    ogParams.toString() ? `?${ogParams.toString()}` : ""
  }`;
  const pageUrl = slug ? `${ORIGIN}/u/${slug}` : ORIGIN;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, s-maxage=300, stale-while-revalidate=86400"
  );
  res.status(200).send(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="君斗りんくのすれ違ひ通信" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
</head>
<body></body>
</html>`);
}
