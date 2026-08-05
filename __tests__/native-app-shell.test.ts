/**
 * ネイティブアプリ（Capacitor シェル）判定と、それに依存するログインCTA文言を固定する。
 *
 * 背景（2026-08-05 App Store 却下）:
 * - Guideline 4.8: Sign in with Apple は実装済みだったが、`auto=x` の 1 タップ導線が
 *   X を自動クリックするため、審査員が Apple を選ぶ機会そのものが無く
 *   「サードパーティログインしか無い」と判定された。
 * - Guideline 2.3.7: CTA 下の「無料・1タップ」がスクリーンショットに写り込み、
 *   価格への言及（無料・割引を含む）としてメタデータ違反を取られた。
 *
 * このアプリは capacitor.config.json の server.url でリモートWebを読むため、
 * ネイティブアプリの中でも Platform.OS === "web" になる。Platform では判別できず、
 * Capacitor ブリッジの有無で見るしかない — ここを取り違えると両方の却下が再発する。
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { isNativeAppShell, loginCtaNote } from "@/lib/native-app-shell";

type CapacitorWindow = Window & typeof globalThis & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

function withCapacitor(isNative: boolean | (() => boolean)): CapacitorWindow {
  return {
    Capacitor: {
      isNativePlatform: typeof isNative === "function" ? isNative : () => isNative,
    },
  } as CapacitorWindow;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isNativeAppShell", () => {
  it("Capacitor が native を返せばネイティブ扱い", () => {
    expect(isNativeAppShell(withCapacitor(true))).toBe(true);
  });

  it("Capacitor はあるが native でなければ Web 扱い", () => {
    expect(isNativeAppShell(withCapacitor(false))).toBe(false);
  });

  it("Capacitor が無い通常ブラウザは Web 扱い", () => {
    expect(isNativeAppShell({} as CapacitorWindow)).toBe(false);
  });

  it("isNativePlatform が例外を投げても落ちない（判定は Web 側に倒す）", () => {
    const win = withCapacitor(() => {
      throw new Error("bridge unavailable");
    });
    expect(isNativeAppShell(win)).toBe(false);
  });
});

describe("loginCtaNote（Guideline 2.3.7: 価格表現の出し分け）", () => {
  it("ネイティブアプリでは価格表現を出さない", () => {
    vi.stubGlobal("window", withCapacitor(true));
    const note = loginCtaNote();
    expect(note).not.toContain("無料");
    expect(note).toContain("1タップ");
  });

  it("Web では従来どおり「無料」を出す（販促上の価値を残す）", () => {
    vi.stubGlobal("window", withCapacitor(false));
    expect(loginCtaNote()).toContain("無料");
  });
});
