import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { buildShareCardSvg, renderShareCardImage } from "@/lib/ogp/render-share-card-image";

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
