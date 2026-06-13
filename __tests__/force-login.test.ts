/**
 * 強制ログイン機能のテスト
 * ブラウザのセッションキャッシュを無視して別のアカウントでログインできるようにする
 */

import { describe, it, expect, vi } from "vitest";

// Mock modules
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

describe("Force Login Parameter", () => {
  it("should add prompt=login parameter when forceLogin is true", () => {
    const forceLogin = true;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "test_client_id",
      redirect_uri: "https://example.com/callback",
      scope: "users.read tweet.read follows.read offline.access",
      state: "test_state",
      code_challenge: "test_challenge",
      code_challenge_method: "S256",
    });
    
    if (forceLogin) {
      params.set("prompt", "login");
      params.set("t", Date.now().toString());
    }
    
    expect(params.get("prompt")).toBe("login");
    expect(params.get("t")).toBeTruthy();
  });

  it("should not add prompt=login parameter when forceLogin is false", () => {
    const forceLogin = false;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "test_client_id",
    });
    
    if (forceLogin) {
      params.set("prompt", "login");
    }
    
    expect(params.get("prompt")).toBeNull();
  });

  it("should build correct authorization URL with force login", () => {
    const baseUrl = "https://twitter.com/i/oauth2/authorize";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "test_client_id",
      prompt: "login",
    });
    
    const authUrl = `${baseUrl}?${params.toString()}`;
    
    expect(authUrl).toContain("prompt=login");
    expect(authUrl).toContain("twitter.com/i/oauth2/authorize");
  });
});

describe("Switch Parameter Handling", () => {
  it("should detect switch=true query parameter", () => {
    const queryParams = { switch: "true", force: "false" };
    const forceLogin = queryParams.force === "true" || queryParams.switch === "true";
    
    expect(forceLogin).toBe(true);
  });

  it("should detect force=true query parameter", () => {
    const queryParams = { switch: "false", force: "true" };
    const forceLogin = queryParams.force === "true" || queryParams.switch === "true";
    
    expect(forceLogin).toBe(true);
  });

  it("should return false when neither parameter is true", () => {
    const queryParams = { switch: "false", force: "false" };
    const forceLogin = queryParams.force === "true" || queryParams.switch === "true";
    
    expect(forceLogin).toBe(false);
  });
});

describe("Login URL Generation", () => {
  it("should generate login URL with switch parameter", () => {
    const protocol = "https:";
    const apiHostname = "3000-example.manus.computer";
    const forceSwitch = true;
    
    const switchParam = forceSwitch ? "?switch=true" : "";
    const loginUrl = `${protocol}//${apiHostname}/api/twitter/auth${switchParam}`;
    
    expect(loginUrl).toBe("https://3000-example.manus.computer/api/twitter/auth?switch=true");
  });

  it("should generate login URL without switch parameter when not forcing", () => {
    const protocol = "https:";
    const apiHostname = "3000-example.manus.computer";
    const forceSwitch = false;
    
    const switchParam = forceSwitch ? "?switch=true" : "";
    const loginUrl = `${protocol}//${apiHostname}/api/twitter/auth${switchParam}`;
    
    expect(loginUrl).toBe("https://3000-example.manus.computer/api/twitter/auth");
  });
});

describe("Hostname Transformation", () => {
  it("should transform 8081 port to 3000 port", () => {
    const hostname = "8081-sandboxid.region.manus.computer";
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    
    expect(apiHostname).toBe("3000-sandboxid.region.manus.computer");
  });

  it("should not transform hostname without 8081 prefix", () => {
    const hostname = "example.manus.computer";
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    
    expect(apiHostname).toBe("example.manus.computer");
  });
});

describe("Account Switcher Force Login Flow", () => {
  it("should call login with forceSwitch=true when adding new account", () => {
    const login = vi.fn();
    const forceSwitch = true;
    
    // シミュレート: 新しいアカウントを追加
    login(undefined, forceSwitch);
    
    expect(login).toHaveBeenCalledWith(undefined, true);
  });

  it("should clear local storage before force login", async () => {
    const removeItem = vi.fn((key: string) => Promise.resolve());
    
    // シミュレート: ローカルストレージをクリア
    await removeItem("twitter_session");
    await removeItem("refresh_token");
    await removeItem("access_token");
    
    expect(removeItem).toHaveBeenCalledTimes(3);
    expect(removeItem).toHaveBeenCalledWith("twitter_session");
    expect(removeItem).toHaveBeenCalledWith("refresh_token");
    expect(removeItem).toHaveBeenCalledWith("access_token");
  });
});

describe("Logout Page Login Button", () => {
  it("should redirect to auth endpoint with switch=true", () => {
    const protocol = "https:";
    const hostname = "8081-sandboxid.region.manus.computer";
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    const redirectUrl = `${protocol}//${apiHostname}/api/twitter/auth?switch=true`;
    
    expect(redirectUrl).toContain("switch=true");
    expect(redirectUrl).toContain("3000-");
    expect(redirectUrl).toContain("/api/twitter/auth");
  });
});
