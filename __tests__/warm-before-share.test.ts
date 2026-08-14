/**
 * シェアを開く前に OGP画像のウォームを「待つ」ことを守る。
 *
 * このテストが守る事故（2026-08-14 実測で特定した OGP 不発の真因）:
 * シェア押下時に setWarmImageUrl() で state を更新し、**次のレンダリング**で
 * 温める作りだったため、ウォームが始まる前に X を開いていた。
 * 生成は 1.6〜2.9 秒かかるので、クローラーが先に着いて画像なしカードになる。
 * 本番実測: 未ウォーム → x-vercel-cache: MISS (2.0秒) / ウォーム済み → HIT (0.19秒)。
 *
 * ここで固定するのは2点:
 *   1. ウォームが終わるまで待つ（＝待たずに先へ進まない）
 *   2. ただし待ちすぎない（上限で必ず打ち切り、シェアは絶対に止めない）
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

const { warmOgImageNow, WARM_BEFORE_SHARE_TIMEOUT_MS } = await import(
  "@/hooks/use-warm-og-image"
);

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
});

describe("warmOgImageNow（シェア直前のウォーム）", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("ウォームが終わるまで待ってから返る", async () => {
    let resolved = false;
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve(new Response(null, { status: 200 }));
          }, 40);
        }),
    ) as unknown as typeof fetch;

    await warmOgImageNow("https://example.com/api/og?v=1");
    // 待たずに返っていればここで false になる（＝真因の再現）
    expect(resolved).toBe(true);
  });

  it("クローラーが実際に取りに来るURLをそのまま叩く（加工しない）", async () => {
    const spy = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = spy as unknown as typeof fetch;

    const url = "https://surechigai.kimito.link/api/og?area=%E8%8C%85%E9%87%8E%E5%B8%82&v=123";
    await warmOgImageNow(url);

    expect(spy).toHaveBeenCalledTimes(1);
    // 1文字でも変えると別キャッシュキーになりウォームが無意味になる
    expect((spy.mock.calls[0] as unknown[])[0]).toBe(url);
  });

  it("生成が長引いても上限で打ち切る（シェアを止めない）", async () => {
    // 永久に解決しない fetch = 生成が返ってこない状況
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    const started = Date.now();
    await warmOgImageNow("https://example.com/api/og?v=2", 60);
    const elapsed = Date.now() - started;

    // 打ち切られて必ず返ってくること（ハングしない）
    expect(elapsed).toBeLessThan(1_000);
  });

  it("URL が無ければ何もしない（fetch を呼ばない）", async () => {
    const spy = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = spy as unknown as typeof fetch;

    await warmOgImageNow(null);
    await warmOgImageNow(undefined);
    await warmOgImageNow("");

    expect(spy).not.toHaveBeenCalled();
  });

  it("fetch が投げてもシェアは続行できる（例外を外に出さない）", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("network down")),
    ) as unknown as typeof fetch;

    await expect(warmOgImageNow("https://example.com/api/og?v=3")).resolves.toBeUndefined();
  });

  it("上限は生成の実測上限（2.9秒）より長い", () => {
    // ここが実測より短いと「完了直前で毎回切る」最悪の値になる。
    // 実際、サーバー側の旧実装は 2_500 でこれを踏んでいた。
    expect(WARM_BEFORE_SHARE_TIMEOUT_MS).toBeGreaterThan(2_900);
    // 一方で長すぎると about:blank の待機画面を見せ続けることになる
    expect(WARM_BEFORE_SHARE_TIMEOUT_MS).toBeLessThanOrEqual(5_000);
  });
});
