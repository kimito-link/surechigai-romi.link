/**
 * OGP / X シェア用メタデータの純粋関数（vitest 可能）。
 * サーバーless では @/ エイリアス不可のため定数は直書き（lib/site-urls と同期）。
 */
import {
  capPublicZoom,
  formatPublicCoordinate,
  toPublicPlace,
} from "./sanitize-public-place.js";

const APP_ORIGIN = "https://surechigai.kimito.link";

export type ShareLocationInfo = {
  area: string | null;
  prefecture: string | null;
  /** 逆ジオコーディングの詳細住所。正確な地点を出すときのみ入る */
  address?: string | null;
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

/**
 * OGP・シェア文面に出してよい地名。都道府県と市区町村だけ。
 *
 * 2026-07-31 はチェックイン画面と同じ詳しさ（丁目まで）を出していたが、
 * Xのカードに番地と郵便番号が載る事故になった。公開面は粗い地名に戻す。
 * address が無くても area / prefecture から同じ関門で組む。
 */
export function resolveShareDetailedPlace(
  info: ShareLocationInfo | null | undefined,
): string | null {
  if (!info) return null;
  return toPublicPlace({
    address: info.address,
    area: info.area,
    prefecture: info.prefecture,
  }).label;
}

/** X シェア用 URL（?v= で Card キャッシュを bust。地点ヒントも付与） */
export function buildPublicSharePageUrl(
  slug: string,
  recordedAt: Date | null | undefined,
  origin = APP_ORIGIN,
  location?: ShareLocationInfo | null,
): string {
  const params = new URLSearchParams();
  const v = recordedAt?.getTime() ?? Date.now();
  params.set("v", String(v));
  if (location) {
    const place = toPublicPlace({
      address: location.address,
      area: location.area,
      prefecture: location.prefecture,
    });
    // 公開URLに緯度経度は載せない。6桁座標が投稿URLに残るのを防ぐ。
    if (place.municipality) params.set("area", place.municipality);
    else if (place.prefecture) params.set("area", place.prefecture);
    if (place.prefecture) params.set("pref", place.prefecture);
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
  recordedAt: Date | string;
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
  options?: { name?: string | null; avatar?: string | null },
): URLSearchParams {
  const params = new URLSearchParams();
  const place = toPublicPlace({
    address: info.address,
    area: info.area,
    prefecture: info.prefecture,
  });
  if (place.municipality) params.set("area", place.municipality);
  else if (place.prefecture) params.set("area", place.prefecture);
  if (place.prefecture) params.set("pref", place.prefecture);
  if (info.hasLocation && info.lat != null && info.lng != null) {
    const lat = formatPublicCoordinate(info.lat);
    const lng = formatPublicCoordinate(info.lng);
    if (lat && lng) {
      params.set("lat", lat);
      params.set("lng", lng);
      params.set("zoom", String(capPublicZoom(info.zoom)));
    }
  }
  if (info.recordedAt) {
    params.set("v", String(info.recordedAt.getTime()));
  }
  if (options?.name) params.set("name", options.name);
  // 地図の丸ピンに本人の X アイコンを出す（2026-08-19 指示: とまり木のように
  // 「丸＝その人のサムネ」で誰がどこに居るかを一目で分かるようにする）。
  // 画像は og 側で fetch するので、ここでは URL を渡すだけ。
  if (options?.avatar) params.set("avatar", options.avatar);
  return params;
}

/** HTML meta 用: クエリ最小の OGP 画像入口（302 → /api/og?...） */
export function buildOgRedirectMetaUrl(
  slug: string,
  recordedAt: Date | null | undefined,
  origin = APP_ORIGIN,
): string {
  const v = recordedAt?.getTime() ?? Date.now();
  return `${origin}/api/og-redirect/${slug}?v=${v}`;
}

/** 302 Location: 地図入り OGP 画像の実 URL */
export function buildOgRedirectImageTarget(input: {
  origin?: string;
  location: ShareLocationInfo | null;
  username?: string | null;
  /** 本人の X プロフィール画像。地図の丸ピンに使う */
  avatarUrl?: string | null;
  version?: string | number;
}): string {
  const origin = input.origin ?? APP_ORIGIN;
  const params =
    input.location?.hasLocation && input.location.lat != null && input.location.lng != null
      ? buildOgImageSearchParams(input.location, {
          name: input.username ?? null,
          avatar: input.avatarUrl ?? null,
        })
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
  const rawArea = single("area") ?? null;
  const rawPrefecture = single("pref") ?? null;
  const place = toPublicPlace({ area: rawArea, prefecture: rawPrefecture, address: rawArea });
  const area = place.municipality;
  const prefecture = place.prefecture;
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
  // クエリ由来のヒントには番地を載せない。DB側の住所は後段のサニタイザが
  // 市区町村だけを拾うために引き継ぐ。丁目や郵便番号は公開文面に残さない。
  const withAddress = (loc: ShareLocationInfo): ShareLocationInfo =>
    loc.address || !resolved?.address ? loc : { ...loc, address: resolved.address };

  if (!resolved?.recordedAt || !explicit.recordedAt) return withAddress(explicit);
  if (explicit.recordedAt.getTime() >= resolved.recordedAt.getTime()) {
    return withAddress(explicit);
  }
  return resolved;
}
