/**
 * open-maps-directions のユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("react-native", () => ({
  Linking: {
    canOpenURL: vi.fn().mockResolvedValue(true),
    openURL: vi.fn().mockResolvedValue(undefined),
  },
  Platform: {
    OS: "android",
  },
}));

import { Linking, Platform } from "react-native";
import {
  buildGoogleMapsDirectionsUrl,
  buildAppleMapsDirectionsUrl,
  openMapsDirections,
} from "../open-maps-directions";

describe("buildGoogleMapsDirectionsUrl", () => {
  it("builds driving directions URL with normalized coordinates", () => {
    const url = buildGoogleMapsDirectionsUrl({ lat: 35.681236, lng: 139.767125 });
    expect(url).toContain("https://www.google.com/maps/dir/");
    expect(url).toContain("destination=35.681236%2C139.767125");
    expect(url).toContain("travelmode=driving");
  });

  it("supports walking travel mode", () => {
    const url = buildGoogleMapsDirectionsUrl({
      lat: 35.68,
      lng: 139.76,
      travelMode: "walking",
    });
    expect(url).toContain("travelmode=walking");
  });

  it("returns null for invalid coordinates", () => {
    expect(buildGoogleMapsDirectionsUrl({ lat: NaN, lng: 139.76 })).toBeNull();
    expect(buildGoogleMapsDirectionsUrl({ lat: 91, lng: 0 })).toBeNull();
    expect(buildGoogleMapsDirectionsUrl({ lat: 0, lng: 181 })).toBeNull();
  });
});

describe("buildAppleMapsDirectionsUrl", () => {
  it("builds driving directions URL", () => {
    const url = buildAppleMapsDirectionsUrl({ lat: 35.681236, lng: 139.767125 });
    expect(url).toContain("https://maps.apple.com/");
    expect(url).toContain("daddr=35.681236%2C139.767125");
    expect(url).toContain("dirflg=d");
  });

  it("returns null for invalid coordinates", () => {
    expect(buildAppleMapsDirectionsUrl({ lat: Infinity, lng: 0 })).toBeNull();
  });
});

describe("openMapsDirections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Platform as { OS: string }).OS = "android";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens Google Maps URL on native Android", async () => {
    const result = await openMapsDirections({ lat: 35.68, lng: 139.76 });
    expect(result).toBe(true);
    expect(Linking.canOpenURL).toHaveBeenCalled();
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps/dir/"),
    );
  });

  it("returns false for invalid coordinates without opening URL", async () => {
    const result = await openMapsDirections({ lat: NaN, lng: 0 });
    expect(result).toBe(false);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("returns false when canOpenURL is false", async () => {
    vi.mocked(Linking.canOpenURL).mockResolvedValueOnce(false);
    const result = await openMapsDirections({ lat: 35.68, lng: 139.76 });
    expect(result).toBe(false);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("uses window.open on web", async () => {
    (Platform as { OS: string }).OS = "web";
    const openSpy = vi.fn();
    vi.stubGlobal("window", { open: openSpy });

    const result = await openMapsDirections({ lat: 35.68, lng: 139.76 });
    expect(result).toBe(true);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps/dir/"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("prefers Apple Maps URL on iOS", async () => {
    (Platform as { OS: string }).OS = "ios";
    const result = await openMapsDirections({ lat: 35.68, lng: 139.76 });
    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining("maps.apple.com"),
    );
  });
});
