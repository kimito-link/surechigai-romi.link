/**
 * ネイティブ（iOS/Android）でも OGP のウォームが走ることを守る。
 *
 * このテストが守る事故（2026-08-15 実測で特定）:
 * hooks/use-warm-og-image.ts のガードが `Platform.OS !== "web"` になっており、
 * **アプリからシェアするとウォームが一度も走らなかった**。X のクローラーは常に
 * 未ウォームのURLに来るため、生成 2.86 秒に間に合わず灰色のプレースホルダになる。
 * Web から投稿した分だけ画像が出ていたのはこのため（同一URLで MISS/HIT が割れた）。
 *
 * 本番実測: 未ウォーム = x-vercel-cache: MISS 2.86秒 / ウォーム済み = HIT 0.12秒。
 *
 * なぜ別ファイルなのか:
 * warm-before-share.test.ts は冒頭の vi.mock で Platform.OS を "web" に固定している。
 * 固定したままでは「ネイティブで動かない」という当の欠陥を絶対に検出できない。
 * 実際そのテストは欠陥がある状態でも緑のままだった。
 *
 * ここで固定するのは2点:
 *   1. ネイティブでも fetch が呼ばれる（＝ Platform ガードを戻したら落ちる）
 *   2. Web 専用の fetch オプション(mode/cache)をネイティブに渡さない
 */
import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

const { warmOgImageNow } = await import("@/hooks/use-warm-og-image");

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("warmOgImageNow（ネイティブ）", () => {
  it("iOS でもウォームの fetch を実行する", async () => {
    const spy = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = spy as unknown as typeof fetch;

    const url = "https://surechigai.kimito.link/api/og?area=%E8%8C%85%E9%87%8E%E5%B8%82&v=123";
    await warmOgImageNow(url);

    // Platform ガードを `Platform.OS !== "web"` に戻すとここが 0 回になって落ちる
    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0] as unknown[])[0]).toBe(url);
  });

  it("Web 専用の fetch オプションをネイティブに渡さない", async () => {
    const spy = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = spy as unknown as typeof fetch;

    await warmOgImageNow("https://surechigai.kimito.link/api/og?v=1");

    const init = (spy.mock.calls[0] as unknown[])[1] as RequestInit | undefined;
    // RN の fetch に mode:"no-cors" / cache:"force-cache" は無い（渡すと壊れうる）
    expect(init?.mode).toBeUndefined();
    expect(init?.cache).toBeUndefined();
  });

  it("ネイティブでも URL が無ければ fetch しない", async () => {
    const spy = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = spy as unknown as typeof fetch;

    await warmOgImageNow(null);
    await warmOgImageNow(undefined);
    await warmOgImageNow("");

    expect(spy).not.toHaveBeenCalled();
  });

  it("ネイティブで fetch が投げてもシェアは続行できる", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("network down")),
    ) as unknown as typeof fetch;

    await expect(
      warmOgImageNow("https://surechigai.kimito.link/api/og?v=1"),
    ).resolves.toBeUndefined();
  });
});
