import { describe, expect, it } from "vitest";
import {
  buildShareCardMetaHtml,
  SHARE_CARD_CACHE_CONTROL,
  shareCardResponseHeaders,
  staticShareCardView,
} from "@/lib/ogp/share-card-meta";
import middleware, { config as middlewareConfig } from "../middleware";

const STORED_IMAGE = "https://blob.example/share-cards/Abcd2345efgh.jpg";

describe("/s メタHTML", () => {
  it("保存済み画像を summary_large_image で指し、場所は詳しいまま出す（2026-11-14 方針）", () => {
    const html = buildShareCardMetaHtml({
      title: "@streamerfunch は 東池袋一丁目 豊島区 東京都 にいるよ｜君斗りんくのすれ違ひ通信",
      description: "東池袋一丁目 豊島区 東京都で記録された足あと。",
      imageUrl: STORED_IMAGE,
      pageUrl: "https://surechigai.kimito.link/s/Abcd2345efgh",
    });
    expect(html).toContain('property="og:image" content="https://blob.example/share-cards/Abcd2345efgh.jpg"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:image" content="https://blob.example/share-cards/Abcd2345efgh.jpg"');
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain("東池袋一丁目");
  });

  it("https でない画像URLは静的画像へ差し替える", () => {
    const html = buildShareCardMetaHtml({
      title: "東京都豊島区にいるよ｜君斗りんくのすれ違ひ通信",
      description: "東京都豊島区で記録された足あと。キミの現在地を刻もう。",
      imageUrl: "http://example.com/x.jpg",
      pageUrl: "https://surechigai.kimito.link/s/Abcd2345efgh",
      fallbackImageUrl: "https://surechigai.kimito.link/og/prefectures/13.jpg",
    });
    expect(html).toContain('property="og:image" content="https://surechigai.kimito.link/og/prefectures/13.jpg"');
  });

  it("メタHTMLのキャッシュは長期 immutable", () => {
    expect(shareCardResponseHeaders()["Cache-Control"]).toBe(SHARE_CARD_CACHE_CONTROL);
    expect(SHARE_CARD_CACHE_CONTROL).toContain("immutable");
    expect(SHARE_CARD_CACHE_CONTROL).toContain("max-age=31536000");
  });

  it("都道府県フォールバックは静的画像と粗いタイトルだけ", () => {
    const view = staticShareCardView("p13");
    const html = buildShareCardMetaHtml(view);
    expect(view.imageUrl).toBe("https://surechigai.kimito.link/og/prefectures/13.jpg");
    expect(view.pageUrl).toBe("https://surechigai.kimito.link/s/p13");
    expect(html).toContain("東京都");
    expect(html).not.toContain("lat=");
    expect(html).not.toContain("丁目");
  });
});

describe("/s の middleware", () => {
  it("matcher に /s/:id を含む", () => {
    expect(middlewareConfig.matcher).toContain("/s/:id");
    expect(middlewareConfig.matcher).toContain("/u/:slug");
  });

  it("Twitterbot にはメタAPIのHTMLを返す", async () => {
    const fetched: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      fetched.push(String(input));
      return new Response("<html>meta</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }) as typeof fetch;
    try {
      const res = await middleware(
        new Request("https://surechigai.kimito.link/s/Abcd2345efgh", {
          headers: { "user-agent": "Twitterbot/1.0" },
        }),
      );
      expect(fetched[0]).toContain("/api/s/Abcd2345efgh");
      expect(await res?.text()).toContain("meta");
      expect(res?.status).toBe(200);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("人間はアプリトップへリダイレクトする", async () => {
    const res = await middleware(
      new Request("https://surechigai.kimito.link/s/Abcd2345efgh", {
        headers: { "user-agent": "Mozilla/5.0" },
      }),
    );
    expect(res?.status).toBe(302);
    expect(res?.headers.get("location")).toBe("https://surechigai.kimito.link/");
    expect(res?.headers.get("cache-control")).toContain("no-store");
  });
});
