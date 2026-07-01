/**
 * api/u/[slug].ts
 *
 * 公開共有リンク /u/<slug> のクローラー向けメタHTMLを返す Vercel Function。
 * - slug から「最後の記録地点」を解決し、OGP/Twitter Card メタを生成。
 * - og:image は /api/og?lat=... を直接指す（& は HTML 属性内でエスケープしない）。
 * - 人間のブラウザは Expo SPA の /u/<slug> 地図画面へ（middleware は bot のみ rewrite）。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../server/db/connection.js";
import { getShareInfoBySlug } from "../../modules/encounter/db/queries.js";
import {
  buildOgRedirectImageTarget,
  parseShareLocationFromQuery,
  preferExplicitShareLocation,
  resolveShareAreaLabel,
  type ShareLocationInfo,
} from "../../lib/ogp/share-meta.js";

const ORIGIN = "https://surechigai.kimito.link";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** URL 属性用（& はエスケープしない — X/Facebook の og:image 取得互換） */
function escUrlAttr(url: string): string {
  return url.replace(/"/g, "&quot;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  let title = "君斗りんくのすれ違ひ通信｜会いたい君がいる現在地";
  let description =
    "位置情報で近くにいた人とすれ違える、無料のすれ違い通信。会いたい君がいる現在地をたどろう。";
  let resolvedLocation: ShareLocationInfo | null = null;
  let shareUsername: string | null = null;

  if (slug && /^[A-Za-z0-9]{1,16}$/.test(slug)) {
    try {
      const db = await getDb();
      if (db) {
        const info = await getShareInfoBySlug(db, slug, undefined, { ogpContext: true });
        shareUsername = info?.username ?? null;
        const queryHint = parseShareLocationFromQuery(req.query);
        resolvedLocation = preferExplicitShareLocation(
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

        if (info || resolvedLocation) {
          const who = info?.username ? `@${info.username}` : info?.name ?? "この人";
          const place =
            resolveShareAreaLabel(resolvedLocation) ??
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
        }
      }
    } catch {
      // 解決失敗時は汎用メタにフォールバック
    }
  }

  const vRaw = req.query.v;
  const vHint = Array.isArray(vRaw) ? vRaw[0] : vRaw;
  const versionFromQuery =
    vHint != null && Number.isFinite(Number(vHint)) ? new Date(Number(vHint)) : null;

  const ogImage =
    slug && /^[A-Za-z0-9]{1,16}$/.test(slug)
      ? buildOgRedirectImageTarget({
          origin: ORIGIN,
          location: resolvedLocation,
          username: shareUsername,
          version:
            resolvedLocation?.recordedAt?.getTime() ??
            versionFromQuery?.getTime() ??
            Date.now(),
        })
      : `${ORIGIN}/api/og`;
  const pageUrl = slug ? `${ORIGIN}/u/${slug}` : ORIGIN;
  const imageAlt = title.replace(/｜.*$/, "").trim();

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
  );
  res.status(200).send(`<!DOCTYPE html>
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
<meta property="og:image" content="${escUrlAttr(ogImage)}" />
<meta property="og:image:secure_url" content="${escUrlAttr(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escHtml(title)}" />
<meta name="twitter:description" content="${escHtml(description)}" />
<meta name="twitter:image" content="${escUrlAttr(ogImage)}" />
<meta name="twitter:image:alt" content="${escHtml(imageAlt)}" />
</head>
<body></body>
</html>`);
}
