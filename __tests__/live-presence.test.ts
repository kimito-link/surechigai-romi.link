import { describe, expect, it } from "vitest";
import { latLngToRadarPercent } from "../lib/japan-radar-position.js";
import {
  LIVE_PRESENCE_MIN_PULSE_GAP_MS,
  LIVE_PRESENCE_PULSE_INTERVAL_MS,
  isLivePresenceFresh,
  shortPlaceLabel,
} from "../modules/encounter/core/live-presence.js";

describe("japan-radar-position", () => {
  it("既知の都市座標をおおよそ正しい % に変換する", () => {
    const otaru = latLngToRadarPercent(43.2, 141.0);
    expect(otaru).not.toBeNull();
    expect(otaru!.x).toBeGreaterThan(65);
    expect(otaru!.y).toBeLessThan(20);

    const fukuoka = latLngToRadarPercent(33.6, 130.4);
    expect(fukuoka).not.toBeNull();
    expect(fukuoka!.x).toBeLessThan(15);
    expect(fukuoka!.y).toBeGreaterThan(80);
  });
});

describe("live-presence", () => {
  it("shortPlaceLabel は県名プレフィックスを除く", () => {
    expect(shortPlaceLabel("北海道小樽市", "北海道")).toBe("小樽市");
  });

  it("isLivePresenceFresh は5分以内のみ true", () => {
    const now = Date.now();
    expect(isLivePresenceFresh(new Date(now - 4 * 60 * 1000), now)).toBe(true);
    expect(isLivePresenceFresh(new Date(now - 6 * 60 * 1000), now)).toBe(false);
  });

  it("pulse 間隔は API 負荷を抑える設定", () => {
    expect(LIVE_PRESENCE_PULSE_INTERVAL_MS).toBe(60 * 1000);
    expect(LIVE_PRESENCE_MIN_PULSE_GAP_MS).toBe(30 * 1000);
  });
});
