/**
 * OGP / X シェア用メタデータの純粋関数（vitest 可能）。
 */

export type ShareLocationInfo = {
  area: string | null;
  prefecture: string | null;
  lat: number | null;
  lng: number | null;
  hasLocation: boolean;
  zoom: number;
  recordedAt: Date | null;
};

/** 共有テキスト用の市区町村ラベル（公開地点のみを渡す前提） */
export function resolveShareAreaLabel(info: ShareLocationInfo | null | undefined): string | null {
  if (!info) return null;
  return info.area ?? info.prefecture ?? null;
}

/** X シェア用 URL（?v= で Card キャッシュを bust。地点ヒントも付与） */
export function buildPublicSharePageUrl(
  slug: string,
  recordedAt: Date | null | undefined,
  origin = "https://surechigai.kimito.link",
  location?: ShareLocationInfo | null,
): string {
  const params = new URLSearchParams();
  const v = recordedAt?.getTime() ?? Date.now();
  params.set("v", String(v));
  if (location?.area) params.set("area", location.area);
  if (location?.prefecture) params.set("pref", location.prefecture);
  if (location?.hasLocation && location.lat != null && location.lng != null) {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    params.set("zoom", String(location.zoom));
  }
  return `${origin}/u/${slug}?${params.toString()}`;
}

export type ShareFeaturedTrailPoint = {
  id: number;
  h3R8: string;
  latGrid: number;
  lngGrid: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  municipality: string | null;
  prefecture: string | null;
  address: string | null;
  recordedAt: Date;
  visibility: string;
};

/** /u/<slug> の「最新」表示を OGP と同じ公開地点に揃える */
export function featureShareLocationFirst<T extends ShareFeaturedTrailPoint>(
  locations: T[],
  share: ShareLocationInfo | null | undefined,
): T[] {
  if (!share?.hasLocation || share.lat == null || share.lng == null) {
    return locations;
  }
  const recordedAt = share.recordedAt ?? new Date(0);
  const matchIndex = locations.findIndex(
    (loc) =>
      loc.municipality === share.area &&
      loc.prefecture === share.prefecture &&
      Math.abs(loc.lat - share.lat!) < 0.002 &&
      Math.abs(loc.lng - share.lng!) < 0.002,
  );
  if (matchIndex === 0) return locations;
  if (matchIndex > 0) {
    const next = [...locations];
    const [hit] = next.splice(matchIndex, 1);
    next.unshift(hit);
    return next;
  }
  const featured = {
    id: -1,
    h3R8: "",
    latGrid: share.lat,
    lngGrid: share.lng,
    lat: share.lat,
    lng: share.lng,
    accuracyM: null,
    municipality: share.area,
    prefecture: share.prefecture,
    address: null,
    recordedAt,
    visibility: "public",
  } as T;
  return [featured, ...locations];
}

/** og:image クエリ（位置更新で v= が変わり X のキャッシュを bust） */
export function buildOgImageSearchParams(
  info: ShareLocationInfo,
  options?: { name?: string | null },
): URLSearchParams {
  const params = new URLSearchParams();
  if (info.area) params.set("area", info.area);
  if (info.prefecture) params.set("pref", info.prefecture);
  if (info.hasLocation && info.lat != null && info.lng != null) {
    params.set("lat", String(info.lat));
    params.set("lng", String(info.lng));
    params.set("zoom", String(info.zoom));
  }
  if (info.recordedAt) {
    params.set("v", String(info.recordedAt.getTime()));
  }
  if (options?.name) params.set("name", options.name);
  return params;
}

/** HTML meta 用: クエリ最小の OGP 画像入口（302 → /api/og?...） */
export function buildOgRedirectMetaUrl(
  slug: string,
  recordedAt: Date | null | undefined,
  origin = "https://surechigai.kimito.link",
): string {
  const v = recordedAt?.getTime() ?? Date.now();
  return `${origin}/api/og-redirect/${slug}?v=${v}`;
}

/** 302 Location: 地図入り OGP 画像の実 URL */
export function buildOgRedirectImageTarget(input: {
  origin?: string;
  location: ShareLocationInfo | null;
  username?: string | null;
  version?: string | number;
}): string {
  const origin = input.origin ?? "https://surechigai.kimito.link";
  const params =
    input.location?.hasLocation && input.location.lat != null && input.location.lng != null
      ? buildOgImageSearchParams(input.location, { name: input.username ?? null })
      : new URLSearchParams();

  if (input.version != null && input.version !== "") {
    params.set("v", String(input.version));
  }

  const qs = params.toString();
  return `${origin}/api/og${qs ? `?${qs}` : ""}`;
}

/** /u/<slug>?area=...&lat=... から OGP 用地点ヒントを復元（シェア URL 付属） */
export function parseShareLocationFromQuery(
  query: Record<string, string | string[] | undefined>,
): ShareLocationInfo | null {
  const single = (key: string): string | undefined => {
    const v = query[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const area = single("area") ?? null;
  const prefecture = single("pref") ?? null;
  const latRaw = single("lat");
  const lngRaw = single("lng");
  const zoomRaw = single("zoom");
  const vRaw = single("v");
  const lat = latRaw != null ? Number(latRaw) : null;
  const lng = lngRaw != null ? Number(lngRaw) : null;
  const zoom = zoomRaw != null ? Number(zoomRaw) : 13;
  if (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return null;
  if (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) return null;
  if (!area && lat == null) return null;
  const hasLocation =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const recordedAt =
    vRaw != null && Number.isFinite(Number(vRaw))
      ? new Date(Number(vRaw))
      : null;
  return {
    area,
    prefecture,
    lat: hasLocation ? lat : null,
    lng: hasLocation ? lng : null,
    hasLocation,
    zoom: Number.isFinite(zoom) ? zoom : 13,
    recordedAt,
  };
}

/** クエリ付きシェア URL の地点ヒントを DB 解決結果より優先（明示シェア時） */
export function preferExplicitShareLocation(
  resolved: ShareLocationInfo | null | undefined,
  explicit: ShareLocationInfo | null | undefined,
): ShareLocationInfo | null {
  if (!explicit?.hasLocation || explicit.lat == null || explicit.lng == null) {
    return resolved ?? null;
  }
  if (!resolved?.recordedAt || !explicit.recordedAt) return explicit;
  if (explicit.recordedAt.getTime() >= resolved.recordedAt.getTime()) return explicit;
  return resolved;
}
