/**
 * modules/encounter/core/geocoding.ts
 *
 * Nominatim 逆ジオコーディング（fetch ベース）。
 * User-Agent 設定、1.1秒スロットル。
 *
 * DB・認証・Express に非依存の純粋TS。
 * 移植元: surechigai-nico/server/src/lib/geocoding.ts
 */

const USER_AGENT = "surechigai-romi/0.1.0 (https://surechigai-romi.link)";
const THROTTLE_MS = 1_100;

let lastRequestTime = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < THROTTLE_MS) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, THROTTLE_MS - diff)
    );
  }
  lastRequestTime = Date.now();
}

export type GeocodeResult = {
  /** 市区町村レベルのエリア名（例: "渋谷区"） */
  municipality: string | null;
  /** 都道府県（例: "東京都"） */
  prefecture: string | null;
  /** 表示用エリア名（suburb + district の組み合わせ） */
  areaName: string;
};

type NominatimAddress = {
  state?: string;
  city?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  town?: string;
  village?: string;
};

/**
 * 市区町村を Nominatim 住所から解析する。
 * 移植元: reverseGeocodeToMunicipality のロジック
 */
function parseMunicipality(addr: NominatimAddress): string | null {
  const { city, suburb, town, village } = addr;

  // 東京23区: city = "渋谷区"
  if (city && city.endsWith("区") && !city.includes("市")) {
    return city;
  }
  // 政令指定都市: city="札幌市" + suburb="中央区" → "札幌市中央区"
  if (city && city.endsWith("市") && suburb && suburb.endsWith("区")) {
    return `${city}${suburb}`;
  }
  // 一般市
  if (city) return city;
  // 町村
  if (town) return town;
  if (village) return village;

  return null;
}

/**
 * 表示用エリア名を Nominatim 住所から生成する。
 */
function parseAreaName(addr: NominatimAddress): string {
  const town =
    addr.suburb || addr.neighbourhood || addr.quarter || null;
  const district =
    addr.city_district || addr.city || addr.town || null;

  if (!town && !district) return "不明なエリア";

  const cleanTown = town?.replace(/[一二三四五六七八九十\d]+丁目$/, "") ?? null;
  if (cleanTown && district) return `${cleanTown}(${district})`;
  return `${cleanTown ?? district}エリア`;
}

/**
 * 緯度経度からエリア名 + 市区町村 + 都道府県を取得（API呼び出し1回）。
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const fallback: GeocodeResult = {
    municipality: null,
    prefecture: null,
    areaName: "不明なエリア",
  };

  try {
    await throttle();

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lng}&format=json&zoom=16&accept-language=ja`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as { address?: NominatimAddress };
    const addr = data.address;
    if (!addr) return fallback;

    const prefecture = addr.state ?? null;
    const municipality = parseMunicipality(addr);
    const areaName = parseAreaName(addr);

    return { municipality, prefecture, areaName };
  } catch (e) {
    console.error("[geocoding] 逆ジオコーディングエラー:", e);
    return fallback;
  }
}
