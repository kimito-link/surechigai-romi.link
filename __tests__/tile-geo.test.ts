import { describe, expect, it } from "vitest";
import { fitCenterZoom, clamp, TILE_SIZE } from "@/lib/map/tile-geo";

describe("tile-geo", () => {
  it("fitCenterZoom は0件で日本全体", () => {
    const result = fitCenterZoom([], 400, 300);
    expect(result.zoom).toBe(5);
    expect(result.center.lat).toBeCloseTo(36.2048);
  });

  it("clamp が範囲内に収める", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("TILE_SIZE は 256", () => {
    expect(TILE_SIZE).toBe(256);
  });
});
