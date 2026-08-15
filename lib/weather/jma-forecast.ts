/**
 * lib/weather/jma-forecast.ts
 *
 * 気象庁の予報JSONから「今日の天気」を取り出す。
 *
 * データ源: https://www.jma.go.jp/bosai/forecast/data/forecast/{officeCode}.json
 *
 * ★このAPIは公式なWebAPIとして公開されていない（無保証・仕様変更や停止がありうる）。
 *   よってここは徹底して fail-silent にする: 形が想定と違えば null を返し、
 *   呼び出し側は天気の行を出さないだけ。無保証のデータ源をUIの主役にしない。
 *
 * ★実レスポンスの構造（2026-08-15 に長野県 200000 で実測）:
 *   [0].timeSeries[0] = 天気（areas は県内の地域別: 北部/中部/南部 など）
 *     - weathers[]     : "くもり　所により　夜のはじめ頃　まで　雨" のように全角空白まみれ
 *     - weatherCodes[] : "200" 等
 *   [0].timeSeries[1] = 降水確率(pops)
 *   [0].timeSeries[2] = 気温(temps) — areas は観測地点別、temps は ["最低","最高"]
 *   配列の先頭が「今日」。
 */

export type PrefWeather = {
  /** 例「くもり 所により 夜のはじめ頃 まで 雨」 */
  todayLabel: string;
  /** 気象庁天気コード（将来アイコンに使う。数値化しない） */
  todayWeatherCode: string;
  tempMaxC: number | null;
  tempMinC: number | null;
};

/** 取得の上限時間。UIの補助情報なので短く切る */
const FETCH_TIMEOUT_MS = 2500;

const JMA_FORECAST_BASE =
  "https://www.jma.go.jp/bosai/forecast/data/forecast";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 気象庁の生テキストは全角空白で区切られていて読みにくいので詰める */
function tidyWeatherText(raw: string): string {
  return raw.replace(/[　\s]+/g, " ").trim();
}

/**
 * 予報JSONから今日の天気を抽出する。
 * 想定外の形は例外を投げず null を返す（呼び出し側は行を出さないだけ）。
 */
export function parseJmaForecast(json: unknown): PrefWeather | null {
  try {
    if (!Array.isArray(json) || json.length === 0) return null;

    const head = json[0];
    if (!isRecord(head) || !Array.isArray(head.timeSeries)) return null;

    // --- 天気（timeSeries[0]）---
    const weatherSeries = head.timeSeries[0];
    if (!isRecord(weatherSeries) || !Array.isArray(weatherSeries.areas)) return null;

    const weatherArea = weatherSeries.areas[0];
    if (!isRecord(weatherArea)) return null;

    const weathers = weatherArea.weathers;
    if (!Array.isArray(weathers) || typeof weathers[0] !== "string") return null;

    const todayLabel = tidyWeatherText(weathers[0]);
    if (!todayLabel) return null;

    const codes = weatherArea.weatherCodes;
    const todayWeatherCode =
      Array.isArray(codes) && typeof codes[0] === "string" ? codes[0] : "";

    // --- 気温（temps を持つ timeSeries を探す。位置は県により前後しうる）---
    let tempMinC: number | null = null;
    let tempMaxC: number | null = null;

    for (const series of head.timeSeries) {
      if (!isRecord(series) || !Array.isArray(series.areas)) continue;
      const area = series.areas[0];
      if (!isRecord(area) || !Array.isArray(area.temps)) continue;

      // temps は ["最低", "最高"] の順（実測）
      const [minRaw, maxRaw] = area.temps;
      const min = Number(minRaw);
      const max = Number(maxRaw);
      if (Number.isFinite(min)) tempMinC = min;
      if (Number.isFinite(max)) tempMaxC = max;
      break;
    }

    return { todayLabel, todayWeatherCode, tempMaxC, tempMinC };
  } catch {
    return null;
  }
}

/**
 * 予報区コードの天気を取得する。失敗はすべて null（例外を投げない）。
 *
 * fetchImpl はテスト差し替え用。
 */
export async function fetchPrefWeather(
  officeCode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PrefWeather | null> {
  try {
    const res = await fetchImpl(`${JMA_FORECAST_BASE}/${officeCode}.json`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    // 障害時に HTML が返ることがあるので、JSON パース失敗も null に倒す
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }

    return parseJmaForecast(json);
  } catch {
    return null;
  }
}
