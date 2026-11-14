import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { buildShareCardSvg, fetchMapCardImage, renderShareCardImage } from "@/lib/ogp/render-share-card-image";

describe("共有カード画像", () => {
  it("SVGに渡すのは公開ラベルだけで、番地は描かない", () => {
    const svg = buildShareCardSvg("東京都豊島区");
    expect(svg).toContain("東京都豊島区");
    expect(svg).not.toContain("東池袋");
    expect(svg).not.toContain("170-0013");
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
  });

  it("1200x630のJPEGを300KB未満で返す", async () => {
    const image = await renderShareCardImage({ label: "東京都豊島区" });
    expect(image).not.toBeNull();
    expect(image!.contentType).toBe("image/jpeg");
    expect(image!.body.byteLength).toBeGreaterThan(5_000);
    expect(image!.body.byteLength).toBeLessThan(300 * 1024);
    expect(image!.body[0]).toBe(0xff);
    expect(image!.body[1]).toBe(0xd8);
    const meta = await sharp(image!.body).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
    const stats = await sharp(image!.body).stats();
    const spread = stats.channels.reduce((sum, channel) => sum + channel.stdev, 0);
    expect(spread).toBeGreaterThan(10);
  });
});

describe("地図入り共有カード（2026-11-14 地図カードに戻した）", () => {
  async function mapPng(): Promise<Uint8Array> {
    // 地図らしいばらつきのある 1200x630 PNG
    const raw = Buffer.alloc(1200 * 630 * 3);
    for (let i = 0; i < raw.length; i++) raw[i] = (i * 37) % 251;
    return new Uint8Array(await sharp(raw, { raw: { width: 1200, height: 630, channels: 3 } }).png().toBuffer());
  }

  it("/api/og の地図画像を JPEG(300KB 以下)にして使う", async () => {
    const png = await mapPng();
    let calledUrl = "";
    const fakeFetch = (async (url: string) => {
      calledUrl = url;
      return new Response(Buffer.from(png), { status: 200, headers: { "content-type": "image/png" } });
    }) as unknown as typeof fetch;
    const image = await fetchMapCardImage(
      "https://surechigai.kimito.link/api/og?area=x&lat=35.68&lng=139.76",
      fakeFetch,
    );
    expect(calledUrl).toContain("/api/og");
    expect(image).not.toBeNull();
    expect(image!.contentType).toBe("image/jpeg");
    expect(image!.body.byteLength).toBeLessThan(300 * 1024);
  });

  it("地図が取れない・画像でない・サイズ違いなら null（文字カードへ落ちる）", async () => {
    const fail = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await fetchMapCardImage("https://surechigai.kimito.link/api/og", fail)).toBeNull();
    const html = (async () =>
      new Response("<html>", { status: 200, headers: { "content-type": "text/html" } })) as unknown as typeof fetch;
    expect(await fetchMapCardImage("https://surechigai.kimito.link/api/og", html)).toBeNull();
    const small = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#fff" } }).png().toBuffer();
    const tiny = (async () =>
      new Response(Buffer.from(small), { status: 200, headers: { "content-type": "image/png" } })) as unknown as typeof fetch;
    expect(await fetchMapCardImage("https://surechigai.kimito.link/api/og", tiny)).toBeNull();
    expect(await fetchMapCardImage("http://example.com/x.png", fail)).toBeNull();
  });
});
