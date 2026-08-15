/**
 * hooks/use-pref-weather.ts
 *
 * 足あとの場所の「きょうの天気」を取る。
 *
 * ★位置情報を新しく取らない: 保存済みの prefecture / municipality 文字列だけを使う。
 *   （電池を消耗しないという要件は天気にも適用する）
 *
 * ★取れなければ何も出さない（fail-silent）。気象庁のJSONは無保証なので、
 *   エラー表示もスケルトンも出さずに行ごと消す。天気は補助情報であり、
 *   シートの主役（場所と時刻）を待たせてはいけない。
 */
import { useEffect, useState } from "react";
import type { PrefWeather } from "@/lib/weather/jma-forecast";

/** 同一県の足あとを連続で開いたときに再取得しないための簡易キャッシュ */
const cache = new Map<string, PrefWeather | null>();

export function usePrefWeather(
  prefecture: string | null | undefined,
  municipality?: string | null,
): { weather: PrefWeather | null; isLoading: boolean } {
  const [weather, setWeather] = useState<PrefWeather | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!prefecture) {
      setWeather(null);
      return;
    }

    const key = `${prefecture}/${municipality ?? ""}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      setWeather(cached);
      return;
    }

    // 画面から離れた後に setState しないためのフラグ
    let alive = true;
    setIsLoading(true);

    const params = new URLSearchParams({ pref: prefecture });
    if (municipality) params.set("municipality", municipality);

    void (async () => {
      try {
        const res = await fetch(`/api/weather?${params.toString()}`);
        const data = (await res.json()) as
          | { ok: true; weather: PrefWeather }
          | { ok: false };

        const next = data.ok ? data.weather : null;
        cache.set(key, next);
        if (alive) setWeather(next);
      } catch {
        // 取れなければ出さないだけ（ユーザーにエラーを見せない）
        if (alive) setWeather(null);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [prefecture, municipality]);

  return { weather, isLoading };
}

/** 表示用の1行に整える。天気が無ければ null（呼び出し側は行を出さない） */
export function formatWeatherLine(
  prefecture: string | null | undefined,
  weather: PrefWeather | null,
): string | null {
  if (!weather || !prefecture) return null;

  const temps =
    weather.tempMaxC != null && weather.tempMinC != null
      ? ` ${weather.tempMaxC}°/${weather.tempMinC}°`
      : weather.tempMaxC != null
        ? ` ${weather.tempMaxC}°`
        : "";

  return `きょうの${prefecture}: ${weather.todayLabel}${temps}`;
}
