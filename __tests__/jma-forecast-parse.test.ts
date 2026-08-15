/**
 * 気象庁の予報JSONから「今日の天気」を取り出すパーサを守る。
 *
 * 背景（2026-08-15 ユーザー要望「位置によって天気が違うのでその要素も欲しい」）:
 * 足あとの場所の天気を出す。データ源は気象庁の JSON。
 *
 * ★このAPIは公式なWebAPIとして公開されておらず無保証（仕様変更・停止がありうる）。
 *   よってパーサは「形が想定と違ったら null を返す」設計にし、
 *   呼び出し側は天気の行を出さないだけにする（fail-silent）。
 *   無保証のデータ源をUIの主役にしない。
 *
 * フィクスチャは 2026-08-15 に本番APIから取得した実レスポンス（長野県 200000）を
 * 構造を保ったまま削ったもの。推測で組み立てた形ではない。
 */
import { describe, expect, it } from "vitest";

import { parseJmaForecast, fetchPrefWeather } from "@/lib/weather/jma-forecast";
import fixture from "./fixtures/jma-forecast-nagano.json";

describe("parseJmaForecast（実レスポンスの解釈）", () => {
  it("実データから今日の天気ラベルを取り出せる", () => {
    const result = parseJmaForecast(fixture);

    expect(result).not.toBeNull();
    expect(result!.todayLabel).toContain("くもり");
  });

  it("全角スペースの連続を1つに詰める（気象庁の生データは読みにくい）", () => {
    const result = parseJmaForecast(fixture);

    // 生データは "くもり　所により　夜のはじめ頃　まで　雨" のように全角空白だらけ
    expect(result!.todayLabel).not.toMatch(/　{2,}/);
    expect(result!.todayLabel.trim()).toBe(result!.todayLabel);
  });

  it("最高/最低気温を数値で取り出せる", () => {
    const result = parseJmaForecast(fixture);

    // フィクスチャの temps は ["23","32"] = [最低, 最高]
    expect(result!.tempMinC).toBe(23);
    expect(result!.tempMaxC).toBe(32);
  });

  it("天気コードを保持する（将来アイコンに使う）", () => {
    const result = parseJmaForecast(fixture);

    expect(result!.todayWeatherCode).toMatch(/^\d+$/);
  });

  it("気温が無い形でも天気だけ返す（気温は null）", () => {
    const noTemps = [
      {
        timeSeries: [
          {
            timeDefines: ["2026-08-15T17:00:00+09:00"],
            areas: [
              {
                area: { name: "北部", code: "200010" },
                weatherCodes: ["200"],
                weathers: ["くもり"],
              },
            ],
          },
        ],
      },
    ];

    const result = parseJmaForecast(noTemps);

    expect(result).not.toBeNull();
    expect(result!.todayLabel).toBe("くもり");
    expect(result!.tempMaxC).toBeNull();
    expect(result!.tempMinC).toBeNull();
  });

  it("形が想定外なら null（fail-silent）", () => {
    expect(parseJmaForecast(null)).toBeNull();
    expect(parseJmaForecast({})).toBeNull();
    expect(parseJmaForecast([])).toBeNull();
    expect(parseJmaForecast([{ timeSeries: [] }])).toBeNull();
    expect(parseJmaForecast("突然HTMLが返ってきた")).toBeNull();
    expect(parseJmaForecast([{ timeSeries: [{ areas: [] }] }])).toBeNull();
  });
});

describe("fetchPrefWeather（取得の失敗耐性）", () => {
  it("fetch が reject したら null", async () => {
    const failing = (() => Promise.reject(new Error("network down"))) as typeof fetch;

    await expect(fetchPrefWeather("200000", failing)).resolves.toBeNull();
  });

  it("HTTP エラーなら null", async () => {
    const notFound = (() =>
      Promise.resolve(new Response("nope", { status: 404 }))) as typeof fetch;

    await expect(fetchPrefWeather("200000", notFound)).resolves.toBeNull();
  });

  it("JSON でない本文なら null", async () => {
    const html = (() =>
      Promise.resolve(new Response("<html>maintenance</html>", { status: 200 }))) as typeof fetch;

    await expect(fetchPrefWeather("200000", html)).resolves.toBeNull();
  });

  it("正常なら PrefWeather を返す", async () => {
    const ok = (() =>
      Promise.resolve(
        new Response(JSON.stringify(fixture), { status: 200 }),
      )) as typeof fetch;

    const result = await fetchPrefWeather("200000", ok);

    expect(result).not.toBeNull();
    expect(result!.todayLabel).toContain("くもり");
  });
});
