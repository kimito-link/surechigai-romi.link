import { describe, expect, it } from "vitest";
import {
  detectInstalledWebShell,
  shouldAutoStartLocation,
} from "@/lib/location-start-policy";

describe("shouldAutoStartLocation", () => {
  it("does not auto-start without opt-in on normal browser", () => {
    expect(
      shouldAutoStartLocation({ locationOptIn: false, installedShell: false }),
    ).toBe(false);
  });

  it("auto-starts after explicit opt-in", () => {
    expect(
      shouldAutoStartLocation({ locationOptIn: true, installedShell: false }),
    ).toBe(true);
  });

  it("auto-starts on installed shell without opt-in", () => {
    expect(
      shouldAutoStartLocation({ locationOptIn: false, installedShell: true }),
    ).toBe(true);
  });
});

describe("detectInstalledWebShell", () => {
  it("detects iOS standalone", () => {
    expect(
      detectInstalledWebShell({
        window: { matchMedia: () => ({ matches: false }) } as unknown as Window &
          typeof globalThis,
        navigator: { standalone: true } as unknown as Navigator,
      }),
    ).toBe(true);
  });

  it("detects display-mode standalone", () => {
    expect(
      detectInstalledWebShell({
        window: {
          matchMedia: (q: string) => ({ matches: q.includes("standalone") }),
        } as unknown as Window & typeof globalThis,
        navigator: {} as Navigator,
      }),
    ).toBe(true);
  });
});
