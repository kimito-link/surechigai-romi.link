/**
 * OGP 画像への 302 リダイレクト（Node）。
 * HTML meta の og:image はクエリ少なめのこの URL を指し、
 * X/Twitter が Location ヘッダー経由で /api/og?lat=... を取得する。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../server/db/connection.js";
import { getShareInfoBySlug } from "../../modules/encounter/db/queries.js";
import {
  buildOgImageSearchParams,
  buildOgRedirectImageTarget,
  parseShareLocationFromQuery,
  preferExplicitShareLocation,
  type ShareLocationInfo,
} from "../../lib/ogp/share-meta.js";

const ORIGIN = "https://surechigai.kimito.link";

function toShareLocation(info: NonNullable<Awaited<ReturnType<typeof getShareInfoBySlug>>>): ShareLocationInfo {
  return {
    area: info.area,
    prefecture: info.prefecture,
    lat: info.lat,
    lng: info.lng,
    hasLocation: info.hasLocation,
    zoom: info.zoom,
    recordedAt: info.recordedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug || !/^[A-Za-z0-9]{1,16}$/.test(slug)) {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.redirect(302, `${ORIGIN}/api/og`);
    return;
  }

  let username: string | null = null;
  let location: ShareLocationInfo | null = null;

  try {
    const db = await getDb();
    if (db) {
      const info = await getShareInfoBySlug(db, slug, undefined, { ogpContext: true });
      username = info?.username ?? null;
      const queryHint = parseShareLocationFromQuery(req.query);
      location = preferExplicitShareLocation(info ? toShareLocation(info) : null, queryHint);
    }
  } catch {
    // DB 失敗時は汎用 OGP へ
  }

  const vRaw = req.query.v;
  const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
  const target = buildOgRedirectImageTarget({
    origin: ORIGIN,
    location,
    username,
    version: v ?? location?.recordedAt?.getTime() ?? Date.now(),
  });

  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=86400");
  res.redirect(302, target);
}
