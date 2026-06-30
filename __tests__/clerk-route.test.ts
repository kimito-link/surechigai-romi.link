import { describe, expect, it } from "vitest";
import {
  SIGN_IN_HREF,
  SIGN_UP_HREF,
  buildSignInHref,
  isClerkSsoCallback,
  upgradeAuthHref,
} from "@/lib/clerk-route";
import { isPublicWebRoute, shouldDeferClerkOnWeb } from "@/lib/clerk-public-routes";

describe("isClerkSsoCallback", () => {
  it("detects the Clerk callback segment", () => {
    expect(isClerkSsoCallback(["sso-callback"])).toBe(true);
  });

  it("does not treat the sign-in root as a callback", () => {
    expect(isClerkSsoCallback(undefined)).toBe(false);
    expect(isClerkSsoCallback([])).toBe(false);
  });
});

describe("auth href 定数", () => {
  it("ホーム直行の redirect_url を持つ", () => {
    expect(SIGN_IN_HREF).toBe("/sign-in?redirect_url=%2F");
    expect(SIGN_UP_HREF).toBe(SIGN_IN_HREF);
  });

  it("buildSignInHref が returnTo をエンコードする", () => {
    expect(buildSignInHref("/map")).toBe("/sign-in?redirect_url=%2Fmap");
  });
});

describe("upgradeAuthHref", () => {
  it("素の /sign-in を正規 href へ格上げ", () => {
    expect(upgradeAuthHref("/sign-in/")).toBe(SIGN_IN_HREF);
    expect(upgradeAuthHref("/sign-in")).toBe(SIGN_IN_HREF);
  });

  it("既に redirect_url 付きの href はそのまま", () => {
    expect(upgradeAuthHref(SIGN_IN_HREF)).toBe(SIGN_IN_HREF);
  });

  it("無関係なパスはそのまま返す", () => {
    expect(upgradeAuthHref("/how-to")).toBe("/how-to");
  });
});

describe("isPublicWebRoute", () => {
  it("共有リンク /u/* を公開ルートと判定", () => {
    expect(isPublicWebRoute("/u/abc123")).toBe(true);
  });

  it("アプリ本体は公開ルートではない", () => {
    expect(isPublicWebRoute("/")).toBe(false);
    expect(isPublicWebRoute("/sign-in")).toBe(false);
  });
});

describe("shouldDeferClerkOnWeb", () => {
  it("Web トップだけ Clerk を defer", () => {
    expect(shouldDeferClerkOnWeb("/")).toBe(true);
    expect(shouldDeferClerkOnWeb("/index")).toBe(true);
  });

  it("それ以外は defer しない", () => {
    expect(shouldDeferClerkOnWeb("/sign-in")).toBe(false);
    expect(shouldDeferClerkOnWeb("/checkin")).toBe(false);
    expect(shouldDeferClerkOnWeb("/u/demo")).toBe(false);
  });
});
