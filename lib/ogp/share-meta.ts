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

/** X シェア用 URL（?v= で Card キャッシュを bust） */
export function buildPublicSharePageUrl(
  slug: string,
  recordedAt: Date | null | undefined,
  origin = "https://surechigai.kimito.link",
): string {
  const v = recordedAt?.getTime() ?? Date.now();
  return `${origin}/u/${slug}?v=${v}`;
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
export function buildOgImageSearchParams(info: ShareLocationInfo): URLSearchParams {
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
  return params;
}
