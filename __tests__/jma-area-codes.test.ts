/**
 * 都道府県 → 気象庁 office コードの対応表を守る。
 *
 * ★なぜ市区町村まで見るのか（2026-08-15 実データで判明）:
 *   気象庁は北海道を8地域、沖縄を4地域、鹿児島を2地域に分けている。
 *   北海道を1コードで代表させると、稚内（宗谷）の足あとに函館（渡島）の天気が出る。
 *   数百km離れるので「その場所の天気」という趣旨が壊れる。
 *   よってこの3道県だけ市区町村名から地域を引く。
 *
 * ★constants/prefectures.ts の47件と表記を揃える必要がある。
 *   ずれると「天気が出ない県」が静かに生まれる（fail-silent 設計のため気づけない）。
 */
import { describe, expect, it } from "vitest";

import { jmaOfficeCodeFor, supportedPrefectures } from "@/lib/weather/jma-area-codes";
import { prefectures } from "@/constants/prefectures";

describe("jmaOfficeCodeFor（都道府県 → 予報区コード）", () => {
  it("アプリが扱う47都道府県すべてでコードが引ける", () => {
    const missing = prefectures.filter((p) => jmaOfficeCodeFor(p) == null);

    // constants/prefectures.ts と表記がずれたらここで落ちる
    expect(missing).toEqual([]);
  });

  it("対応表と constants/prefectures.ts の件数が一致する", () => {
    expect(supportedPrefectures()).toHaveLength(prefectures.length);
  });

  it("コードはすべて6桁の数字", () => {
    for (const pref of prefectures) {
      expect(jmaOfficeCodeFor(pref)).toMatch(/^\d{6}$/);
    }
  });

  it("未知の入力は null", () => {
    expect(jmaOfficeCodeFor("存在しない県")).toBeNull();
    expect(jmaOfficeCodeFor("")).toBeNull();
    expect(jmaOfficeCodeFor(null)).toBeNull();
    expect(jmaOfficeCodeFor(undefined)).toBeNull();
  });
});

describe("細分されている道県（市区町村で地域を分ける）", () => {
  it("北海道は市区町村で別の地域コードになる", () => {
    const wakkanai = jmaOfficeCodeFor("北海道", "稚内市");
    const hakodate = jmaOfficeCodeFor("北海道", "函館市");
    const sapporo = jmaOfficeCodeFor("北海道", "札幌市");

    // 稚内と函館が同じコードなら、数百km離れた天気を出している
    expect(wakkanai).not.toBe(hakodate);
    expect(wakkanai).toBe("011000"); // 宗谷
    expect(hakodate).toBe("017000"); // 渡島・檜山
    expect(sapporo).toBe("016000"); // 石狩（既定）
  });

  it("北海道の未知の市区町村は既定（石狩）にフォールバックする", () => {
    expect(jmaOfficeCodeFor("北海道", "架空町")).toBe("016000");
    expect(jmaOfficeCodeFor("北海道")).toBe("016000");
  });

  it("沖縄は本島と離島で分かれる", () => {
    expect(jmaOfficeCodeFor("沖縄県", "那覇市")).toBe("471000");
    expect(jmaOfficeCodeFor("沖縄県", "宮古島市")).toBe("473000");
    expect(jmaOfficeCodeFor("沖縄県", "石垣市")).toBe("474000");
  });

  it("鹿児島は奄美とそれ以外で分かれる", () => {
    expect(jmaOfficeCodeFor("鹿児島県", "鹿児島市")).toBe("460100");
    expect(jmaOfficeCodeFor("鹿児島県", "奄美市")).toBe("460040");
  });

  it("細分されていない県では市区町村を渡しても同じコード", () => {
    expect(jmaOfficeCodeFor("長野県", "茅野市")).toBe(jmaOfficeCodeFor("長野県"));
    expect(jmaOfficeCodeFor("東京都", "八丈町")).toBe(jmaOfficeCodeFor("東京都"));
  });
});
