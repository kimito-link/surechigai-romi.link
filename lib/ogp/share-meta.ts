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
