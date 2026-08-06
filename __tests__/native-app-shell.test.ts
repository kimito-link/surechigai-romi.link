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
 * 判定は2系統ある（2026-08-06 追記）:
 * - Capacitor（server.url 構成）: ネイティブでも Platform.OS === "web" なので
 *   window.Capacitor.isNativePlatform() を見る
 * - Expo prebuild（バンドルJS実行）: Platform.OS === "ios" | "android" になり
 *   window.Capacitor は存在しない
 *
 * 片方だけを見ると却下が再発する。prebuild 後に Capacitor 判定だけを残すと
 * 常に false になり、auto=x の自動クリックが復活して 4.8 を、
 * CTA の「無料」が復活して 2.3.7 を再び踏む。両系統をこのテストで固定する。
 */
import { afterEach, describe, expect, it, vi } from "vitest";

// Capacitor 構成を再現する: ネイティブアプリの中でも Platform.OS === "web" になる。
// lib/native-app-shell.ts が react-native を import するようになった（2026-08-06）ため、
// 実体を読ませると vitest の変換で解析に失敗する。ここでは必要な形だけスタブする。
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

const { isNativeAppShell, loginCtaNote } = await import("@/lib/native-app-shell");

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
