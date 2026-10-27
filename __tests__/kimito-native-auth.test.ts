/**
 * kimito.link のアプリ内ログインが、外部ブラウザではなく認証セッションで戻ること。
 * iOS は ASWebAuthenticationSession、Android は Custom Tabs（どちらも openAuthSessionAsync）。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import appConfig from "@/app.config.json";
import { getNativeOAuthRedirectUrl, NATIVE_OAUTH_CALLBACK_PATH } from "@/lib/auth/native-redirect";
import {
  NATIVE_APP_SCHEME,
  NATIVE_AUTH_CALLBACK_PATH,
  buildHandoffUrl,
  buildKimitoSignInStartUrl,
  buildNativeCallbackUrl,
  decideNativeHandoff,
  formatNativeReturnUrl,
  isOwnHandoffUrl,
  isOwnNativeCallbackUrl,
  parseTicketFromCallback,
} from "@/shared/kimito-native-auth";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
/** 説明コメントに書いた禁止語を実装の使用と取り違えない。 */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("kimito.link 認証セッションの戻り先", () => {
  it("スキームとパスは app.config と OAuth の戻り先と一致する", () => {
    const scheme = (appConfig as { identity: { iosScheme: string } }).identity.iosScheme;
    expect(NATIVE_APP_SCHEME).toBe(scheme);
    expect(NATIVE_AUTH_CALLBACK_PATH).toBe(NATIVE_OAUTH_CALLBACK_PATH);
    expect(formatNativeReturnUrl()).toBe(getNativeOAuthRedirectUrl());
    expect(formatNativeReturnUrl()).toBe("surechigai://oauth-native-callback");
  });

  it("未ログインの初回は kimito.link のサインインへ https で飛ばす", () => {
    const handoff = buildHandoffUrl();
    const result = decideNativeHandoff({
      userId: null,
      tried: false,
      ticket: null,
      unavailable: false,
      handoffUrl: handoff,
      returnUrl: formatNativeReturnUrl(),
    });
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") return;
    expect(result.location.startsWith("https://kimito.link/sign-in/")).toBe(true);
    expect(result.location).toContain(encodeURIComponent(`${handoff}?tried=1`));
    expect(result.location).not.toContain("surechigai://");
  });

  it("サインインから戻っても未ログインなら自動ではループせず、JS 無しの案内を出す", () => {
    const result = decideNativeHandoff({
      userId: null,
      tried: true,
      ticket: null,
      unavailable: false,
      handoffUrl: buildHandoffUrl(),
      returnUrl: formatNativeReturnUrl(),
    });
    expect(result.kind).toBe("html");
    if (result.kind !== "html") return;
    expect(result.html).toContain("kimito.link でログイン");
    expect(result.html).toContain("system-ui");
    expect(result.html).not.toContain("fonts.googleapis");
    expect(result.html).toContain("width=device-width, initial-scale=1, viewport-fit=cover");
    expect(result.html).not.toMatch(/maximum-scale|minimum-scale|user-scalable/);
    expect(result.html).toContain("overflow-x:hidden");
  });

  it("ログイン済みならカスタムスキームへ ticket 付きで戻す（https には戻さない）", () => {
    const ticket = "sit_abcdefghijklmnop";
    const result = decideNativeHandoff({
      userId: "user_123",
      tried: false,
      ticket,
      unavailable: false,
      handoffUrl: buildHandoffUrl(),
      returnUrl: formatNativeReturnUrl(),
    });
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") return;
    expect(result.location.startsWith("surechigai://oauth-native-callback?ticket=")).toBe(true);
    expect(result.location).toContain(ticket);
    expect(result.location.startsWith("https:")).toBe(false);
    expect(parseTicketFromCallback(result.location)).toBe(ticket);
  });

  it("https の URL や空の ticket、別ホストのスキームはアプリの戻りとして受け取らない", () => {
    const ticket = "sit_abcdefghijklmnop";
    expect(parseTicketFromCallback(`https://kimito.link/sign-in/?ticket=${ticket}`)).toBeNull();
    expect(parseTicketFromCallback(`https://surechigai.kimito.link/auth/return?ticket=${ticket}`)).toBeNull();
    expect(parseTicketFromCallback("surechigai://oauth-native-callback")).toBeNull();
    expect(parseTicketFromCallback("surechigai://oauth-native-callback?ticket=short")).toBeNull();
    expect(parseTicketFromCallback(`surechigai://evil.example/?ticket=${ticket}`)).toBeNull();
    expect(parseTicketFromCallback(`surechigai://oauth-native-callback.evil/?ticket=${ticket}`)).toBeNull();
    expect(parseTicketFromCallback(`surechigai://oauth-native-callback?ticket=${ticket}&next=https://evil.example`)).toBeNull();
    expect(parseTicketFromCallback(null)).toBeNull();
    expect(isOwnNativeCallbackUrl("surechigai://oauth-native-callback")).toBe(true);
    expect(isOwnNativeCallbackUrl(`surechigai://oauth-native-callback?ticket=${ticket}`)).toBe(true);
    expect(isOwnNativeCallbackUrl("otherapp://oauth-native-callback")).toBe(false);
  });

  it("サインイン URL は handoff の redirect_url だけを載せる", () => {
    const handoff = buildHandoffUrl("https://surechigai.kimito.link");
    const start = buildKimitoSignInStartUrl(handoff);
    expect(start).toBeTruthy();
    const url = new URL(start ?? "");
    expect(url.origin + url.pathname).toBe("https://kimito.link/sign-in/");
    expect(url.searchParams.get("redirect_url")).toBe(handoff);
    expect(buildHandoffUrl("https://evil.example")).toBe(handoff);
    expect(buildKimitoSignInStartUrl("https://evil.example/api/auth/native-handoff")).toBeNull();
    expect(isOwnHandoffUrl(handoff)).toBe(true);
    expect(isOwnHandoffUrl("https://surechigai.kimito.link.evil/api/auth/native-handoff")).toBe(false);
    expect(buildNativeCallbackUrl("https://evil.example/auth/return", "sit_abcdefghijklmnop")).toBeNull();
    expect(buildNativeCallbackUrl("surechigai://evil", "sit_abcdefghijklmnop")).toBeNull();
  });

  it("別オリジンや別スキームへ ticket を渡さない", () => {
    const foreign = decideNativeHandoff({
      userId: "user_123",
      tried: false,
      ticket: "sit_abcdefghijklmnop",
      unavailable: false,
      handoffUrl: buildHandoffUrl(),
      returnUrl: "surechigai://evil.example",
    });
    expect(foreign.kind).toBe("error");
    const foreignHandoff = decideNativeHandoff({
      userId: null,
      tried: false,
      ticket: null,
      unavailable: false,
      handoffUrl: "https://evil.example/api/auth/native-handoff",
      returnUrl: formatNativeReturnUrl(),
    });
    expect(foreignHandoff.kind).toBe("error");
  });

  it("コールバック URL の組み立てと解析が往復する", () => {
    const ticket = "eyJhbGciOiJIUzI1NiJ9.payload.signature";
    const callback = buildNativeCallbackUrl(formatNativeReturnUrl(), ticket);
    expect(parseTicketFromCallback(callback)).toBe(ticket);
  });

  it("開く実装は openAuthSessionAsync で、外部ブラウザの Linking.openURL を使わない", () => {
    const src = code("lib/auth/open-kimito-auth-session.ts");
    expect(src).toContain("openAuthSessionAsync");
    expect(src).toContain("preferEphemeralSession: false");
    expect(src).not.toContain("Linking.openURL");
    expect(src).toContain("getNativeOAuthRedirectUrl");
  });

  it("iOS と Android のサインイン画面は同じ kimito.link 入口を持つ", () => {
    const signIn = read("components/organisms/clerk-sign-in.tsx");
    const fallback = read("components/auth/clerk-mount-fallback.tsx");
    expect(signIn).toContain('login(undefined, false, "kimito")');
    expect(fallback).toContain('login(undefined, false, "kimito")');
    expect(signIn).not.toMatch(/Platform\.OS === ["']ios["'][\s\S]{0,200}kimito/);
    const bridge = read("components/providers/clerk-auth-bridge.tsx");
    expect(bridge).toContain('provider === "kimito"');
    expect(bridge).toContain("openKimitoAuthSession");
    expect(bridge).toContain('strategy: "ticket"');
  });
});
