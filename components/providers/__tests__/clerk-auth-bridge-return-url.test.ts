import { describe, expect, it, vi } from "vitest";

// clerk-auth-bridge.tsx はコンポーネント全体としては expo-modules-core 経由の
// ネイティブモジュール解決に依存し vitest(jsdom)では動かせない
// (features/event-detail の既存除外と同種の制約)。
// resolveReturnUrl/resolveReturnPath は純粋関数でコンポーネント本体と無関係なため、
// ここでは依存を一式モックしてモジュール自体をロードし、対象の2関数だけを検証する。
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));
vi.mock("@clerk/expo", () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useAuth: () => ({ isSignedIn: false, isLoaded: true, signOut: vi.fn() }),
  useOAuth: () => ({ startOAuthFlow: vi.fn() }),
  useClerk: () => ({ signOut: vi.fn() }),
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));
vi.mock("@/lib/_core/auth", () => ({}));
vi.mock("@/lib/token-manager", () => ({ clearAllTokenData: vi.fn() }));
vi.mock("@/lib/clerk-route", () => ({ buildSignInAutoXHref: vi.fn() }));
vi.mock("@/lib/api/config", () => ({ getApiBaseUrl: () => "" }));

const { resolveReturnUrl, resolveReturnPath } = await import(
  "@/components/providers/clerk-auth-bridge"
);

/**
 * ReturnUrl正規化(/(tabs)/→/置換)は auth-context.tsx / clerk-auth-bridge.tsx に
 * 3実装が散在している(refactor-instructions.md Debt #12)。統合前に現行挙動を
 * 固定し、統合後も同じ入出力になることをここで保証する。
 */
describe("resolveReturnUrl", () => {
  it("未指定・空文字は undefined を返す", () => {
    expect(resolveReturnUrl(undefined)).toBeUndefined();
    expect(resolveReturnUrl("")).toBeUndefined();
  });

  it("/(tabs)/ プレフィックスを / に置換し、絶対URLへ組み立てる", () => {
    const result = resolveReturnUrl("/(tabs)/checkin");
    expect(result).toBe(`${window.location.origin}/checkin`);
  });

  it("既に絶対URLならそのまま返す", () => {
    expect(resolveReturnUrl("https://example.com/x")).toBe(
      "https://example.com/x",
    );
  });

  it("先頭スラッシュがなければ付与してから絶対URLにする", () => {
    expect(resolveReturnUrl("checkin")).toBe(
      `${window.location.origin}/checkin`,
    );
  });
});

describe("resolveReturnPath", () => {
  it("未指定・空文字は / を返す", () => {
    expect(resolveReturnPath(undefined)).toBe("/");
    expect(resolveReturnPath("")).toBe("/");
  });

  it("/(tabs)/ プレフィックスを / に置換する", () => {
    expect(resolveReturnPath("/(tabs)/checkin")).toBe("/checkin");
  });

  it("同一originの絶対URLはpath+search+hashへ変換する", () => {
    expect(resolveReturnPath(`${window.location.origin}/map?x=1#y`)).toBe(
      "/map?x=1#y",
    );
  });

  it("他originの絶対URLは / にフォールバックする", () => {
    expect(resolveReturnPath("https://evil.example.com/x")).toBe("/");
  });

  it("先頭スラッシュがなければ付与する", () => {
    expect(resolveReturnPath("checkin")).toBe("/checkin");
  });
});
