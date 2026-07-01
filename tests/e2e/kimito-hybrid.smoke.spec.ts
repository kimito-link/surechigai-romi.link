import { test, expect } from "@playwright/test";

/**
 * kimito.link ハイブリッド — story プロキシと LP 静的配信。
 * PLAYWRIGHT_BASE_URL 未指定時は surechigai 本番の /lp/ を検証。
 */
const STORY_ON_KIMITO = "https://kimito.link/surechigai/story/";
const LP_DIRECT = process.env.PLAYWRIGHT_BASE_URL
  ? `${process.env.PLAYWRIGHT_BASE_URL.replace(/\/$/, "")}/lp/`
  : "https://surechigai.kimito.link/lp/";

test.describe("kimito hybrid LP", () => {
  test("四季 LP が直接配信される", async ({ request }) => {
    const res = await request.get(LP_DIRECT);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain("君斗りんくのすれ違ひ通信");
    expect(html).not.toContain("fonts.googleapis.com");
  });

  test("kimito.link story プロキシ（本番 kimito 反映後）", async ({ request }) => {
    const res = await request.get(STORY_ON_KIMITO);
    if (res.status() === 404) {
      test.skip(true, "kimito.link/surechigai/story/ 未デプロイ");
    }
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain("月日は百代の過客にして");
  });
});
