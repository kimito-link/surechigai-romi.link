/**
 * ヘッダーの「kimito.link マイページ」導線（本家 https://kimito.link/dashboard/）の契約を固定する。
 *
 * 守ること（web-ios-android templates/web/auth-mode/README.md ③ と同じ契約）:
 *   1. 認証の読み込み前は何も描かない（レイアウトも占めない）
 *   2. 未ログインでは何も描かない（本家の sign-in へ送らない。送るとログイン後に戻れない）
 *   3. ログイン中だけ描き、href は https://kimito.link/dashboard/ 固定・クエリ無し
 *   4. ネイティブ経路の openExternalUrl が kimito.link を通す（許可リスト漏れは無言で false を返す。
 *      landing-x-profile-link.test.ts と同じく grep ではなく戻り値で固定する）
 *
 * 描画は @testing-library/react の render（jsdom）で Web 側（<a>）の HTML をそのまま見る。
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render as rtlRender } from "@testing-library/react";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { canOpenURL: vi.fn(), openURL: vi.fn() },
  StyleSheet: { create: (s: unknown) => s },
  Pressable: () => null,
  Text: () => null,
}));

const authState = { user: null as null | { id: number }, isAuthReady: false };
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
}));

const { HeaderKimitoDashboardLink } = await import("@/components/organisms/header-kimito-dashboard-link");
const { resolveKimitoDashboardLink, KIMITO_DASHBOARD_HREF, KIMITO_DASHBOARD_LABEL } = await import(
  "@/components/auth/kimito-dashboard-link"
);
const { openExternalUrl } = await import("@/lib/navigation/external-links");

function render(): string {
  return rtlRender(<HeaderKimitoDashboardLink />).container.innerHTML;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  authState.user = null;
  authState.isAuthReady = false;
});

describe("HeaderKimitoDashboardLink（Web）", () => {
  it("認証の読み込み前は何も描かない", () => {
    authState.isAuthReady = false;
    authState.user = { id: 1 };
    expect(render()).toBe("");
  });

  it("未ログインでは何も描かない（本家の sign-in へ送らない）", () => {
    authState.isAuthReady = true;
    authState.user = null;
    expect(render()).toBe("");
  });

  it("ログイン中だけ <a> を描き、href は https://kimito.link/dashboard/ 固定・クエリ無し", () => {
    authState.isAuthReady = true;
    authState.user = { id: 1 };
    const html = render();
    expect(html).toContain("<a ");
    expect(html).toContain(`href="${KIMITO_DASHBOARD_HREF}"`);
    expect(KIMITO_DASHBOARD_HREF).toBe("https://kimito.link/dashboard/");
    expect(html).not.toContain("?");
    expect(html).toContain("data-kimito-dashboard-anchor");
    expect(html).toContain(KIMITO_DASHBOARD_LABEL);
    // 別タブで開く・opener を渡さない
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*noopener[^"]*"/);
  });
});

describe("resolveKimitoDashboardLink（金型の純関数）", () => {
  it("読み込み前は wait、未ログインは clear、ログイン中は render", () => {
    expect(resolveKimitoDashboardLink({ isLoaded: false, isSignedIn: true })).toEqual({ action: "wait" });
    expect(resolveKimitoDashboardLink({ isLoaded: true, isSignedIn: false })).toEqual({ action: "clear" });
    expect(resolveKimitoDashboardLink({ isLoaded: true, isSignedIn: undefined })).toEqual({ action: "clear" });
    expect(resolveKimitoDashboardLink({ isLoaded: true, isSignedIn: true })).toEqual({
      action: "render",
      href: "https://kimito.link/dashboard/",
      label: KIMITO_DASHBOARD_LABEL,
    });
  });

  it("http やクエリ付きの href は既定 URL に戻す", () => {
    const base = { isLoaded: true, isSignedIn: true };
    expect(resolveKimitoDashboardLink(base, { href: "http://kimito.link/dashboard/" })).toMatchObject({
      href: "https://kimito.link/dashboard/",
    });
    expect(resolveKimitoDashboardLink(base, { href: "https://kimito.link/dashboard/?x=1" })).toMatchObject({
      href: "https://kimito.link/dashboard/",
    });
  });
});

describe("ネイティブ経路: openExternalUrl が kimito.link を通す", () => {
  it("許可リストに kimito.link がある（外すとここが false になって落ちる）", async () => {
    const calls: string[] = [];
    vi.spyOn(window, "open").mockImplementation((url) => {
      if (typeof url === "string") calls.push(url);
      return null;
    });

    await expect(openExternalUrl(KIMITO_DASHBOARD_HREF)).resolves.toBe(true);
    expect(calls).toEqual([KIMITO_DASHBOARD_HREF]);
  });
});
