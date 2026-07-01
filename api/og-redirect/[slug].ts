/**
 * OGP 画像プロキシ（Node）。
 * slug から地点を解決し /api/og を内部 fetch して PNG を 200 で返す。
 * X/Twitter は og:image の 302 追従が不安定なためリダイレクトは使わない。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../server/db/connection.js";
import { getShareInfoBySlug } from "../../modules/encounter/db/queries.js";
import {
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

/** X/Twitter は og:image の 302 追従が不安定なため、200 で PNG を返す */
async function proxyOgImage(target: string): Promise<{ ok: boolean; body?: Buffer; contentType?: string }> {
  try {
    const ogRes = await fetch(target, {
      headers: {
        Accept: "image/png,image/*",
        "User-Agent": "surechigai-og-redirect/1.0 (+https://surechigai.kimito.link)",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!ogRes.ok) return { ok: false };
    const body = Buffer.from(await ogRes.arrayBuffer());
    return {
      ok: true,
      body,
      contentType: ogRes.headers.get("content-type") ?? "image/png",
    };
  } catch {
    return { ok: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug || !/^[A-Za-z0-9]{1,16}$/.test(slug)) {
    const fallback = await proxyOgImage(`${ORIGIN}/api/og`);
    if (fallback.ok && fallback.body) {
      res.setHeader("Content-Type", fallback.contentType ?? "image/png");
      res.setHeader("Cache-Control", "public, max-age=60");
      res.status(200).send(fallback.body);
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(502).send("OGP image unavailable");
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

  const proxied = await proxyOgImage(target);
  if (proxied.ok && proxied.body) {
    res.setHeader("Content-Type", proxied.contentType ?? "image/png");
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    );
    res.status(200).send(proxied.body);
    return;
  }

  const fallback = await proxyOgImage(`${ORIGIN}/api/og`);
  if (fallback.ok && fallback.body) {
    res.setHeader("Content-Type", fallback.contentType ?? "image/png");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).send(fallback.body);
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(502).send("OGP image unavailable");
}
