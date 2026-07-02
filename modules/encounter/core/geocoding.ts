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
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_COOLDOWN_MS = 5 * 60 * 1000;

let lastRequestTime = 0;
let externalDisabledUntil = 0;

type CacheEntry = {
  result: GeocodeResult;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<GeocodeResult>>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < THROTTLE_MS) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, THROTTLE_MS - diff),
    );
  }
  lastRequestTime = Date.now();
}

export type GeocodeResult = {
  municipality: string | null;
  prefecture: string | null;
  areaName: string;
  address: string | null;
};

type NominatimAddress = {
  /** 都道府県。日本では多くが province に入る（北海道/大阪府/神奈川県…） */
  province?: string;
  /** 一部地域は state に都道府県が入る */
  state?: string;
  /** 東京23区など province/state が欠落するケースの最終手段（例 "JP-13"） */
  "ISO3166-2-lvl4"?: string;
  city?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  town?: string;
  village?: string;
};

/**
 * 標準の都道府県順（ISO 3166-2:JP の 01〜47 と一致）。
 * JP-13 → 東京都 のように code-1 を index にして名前へ変換する。
 */
const PREFECTURES_BY_ISO = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

/**
 * 都道府県名を解決する。
 * province → state → ISO3166-2-lvl4(JP-NN) の順でフォールバック。
 * 東京23区は province/state が無く JP-13 だけ返るため ISO 変換が要。
 */
function parsePrefecture(addr: NominatimAddress): string | null {
  if (addr.province) return addr.province;
  if (addr.state) return addr.state;
  const iso = addr["ISO3166-2-lvl4"];
  if (iso && iso.startsWith("JP-")) {
    const n = Number.parseInt(iso.slice(3), 10);
    if (Number.isInteger(n) && n >= 1 && n <= 47) {
      return PREFECTURES_BY_ISO[n - 1];
    }
  }
  return null;
}

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
  const town = addr.suburb || addr.neighbourhood || addr.quarter || null;
  const district = addr.city_district || addr.city || addr.town || null;

  if (!town && !district) return "不明なエリア";

  const cleanTown = town?.replace(/[一二三四五六七八九十\d]+丁目$/, "") ?? null;
  if (cleanTown && district) return `${cleanTown}(${district})`;
  return `${cleanTown ?? district}エリア`;
}

const fallbackGeocode = (): GeocodeResult => ({
  address: null,
  municipality: null,
  prefecture: null,
  areaName: "不明なエリア",
});

function getCached(key: string, now = Date.now()): GeocodeResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCached(key: string, result: GeocodeResult): void {
  cache.set(key, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * チェックイン向け: 上限時間付き逆ジオコーディング。超過時は fallback（500 にしない）。
 */
export async function reverseGeocodeWithTimeout(
  lat: number,
  lng: number,
  timeoutMs: number,
): Promise<GeocodeResult> {
  try {
    return await Promise.race([
      reverseGeocode(lat, lng),
      new Promise<GeocodeResult>((_, reject) => {
        setTimeout(() => reject(new Error("geocode timeout")), timeoutMs);
      }),
    ]);
  } catch (e) {
    console.error("[geocoding] reverseGeocodeWithTimeout:", e);
    return fallbackGeocode();
  }
}

/**
 * 緯度経度からエリア名 + 市区町村 + 都道府県を取得（API呼び出し1回）。
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult> {
  const fallback: GeocodeResult = fallbackGeocode();
  const key = cacheKey(lat, lng);
  const now = Date.now();
  const cached = getCached(key, now);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  if (externalDisabledUntil > now) {
    return fallback;
  }

  const task = reverseGeocodeUncached(lat, lng, key, fallback);
  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}

async function reverseGeocodeUncached(
  lat: number,
  lng: number,
  key: string,
  fallback: GeocodeResult,
): Promise<GeocodeResult> {
  let shouldCacheFallback = false;

  try {
    await throttle();

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lng}&format=json&zoom=18&accept-language=ja`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      if (res.status === 429 || res.status >= 500) {
        externalDisabledUntil = Date.now() + ERROR_COOLDOWN_MS;
      } else {
        shouldCacheFallback = true;
      }
      return fallback;
    }

    const data = (await res.json()) as {
      address?: NominatimAddress;
      display_name?: string;
    };
    const addr = data.address;
    if (!addr) {
      shouldCacheFallback = true;
      return fallback;
    }

    const prefecture = parsePrefecture(addr);
    const municipality = parseMunicipality(addr);
    const areaName = parseAreaName(addr);

    const address = data.display_name ?? null;
    const result = { municipality, prefecture, areaName, address };
    setCached(key, result);
    return result;
  } catch (e) {
    externalDisabledUntil = Date.now() + ERROR_COOLDOWN_MS;
    console.error("[geocoding] 逆ジオコーディングエラー:", e);
    return fallback;
  } finally {
    if (shouldCacheFallback) {
      setCached(key, fallback);
    }
  }
}
