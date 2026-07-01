import { describe, expect, it, vi } from "vitest";
import {
  SIGN_IN_HREF,
  SIGN_UP_HREF,
  buildSignInHref,
  isClerkSsoCallback,
  upgradeAuthHref,
} from "@/lib/clerk-route";
import { isPublicWebRoute, shouldDeferClerkOnWeb, hasClerkSessionHint, shouldUseGuestWebShell, shouldDeferTrpcOnGuestWeb, isGuestAppWebRoute } from "@/lib/clerk-public-routes";

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
  it("Web トップだけ Clerk を defer（セッション hint なし）", () => {
    expect(shouldDeferClerkOnWeb("/")).toBe(true);
    expect(shouldDeferClerkOnWeb("/index")).toBe(true);
  });

  it("Clerk セッション hint があれば `/` でも defer しない", () => {
    const storage = {
      length: 1,
      key: (i: number) => (i === 0 ? "__clerk_db_jwt" : null),
      getItem: () => null,
    };
    vi.stubGlobal("window", { localStorage: storage, document: { cookie: "" } });
    expect(hasClerkSessionHint()).toBe(true);
    expect(shouldDeferClerkOnWeb("/")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("それ以外は defer しない", () => {
    expect(shouldDeferClerkOnWeb("/sign-in")).toBe(false);
    expect(shouldDeferClerkOnWeb("/checkin")).toBe(false);
    expect(shouldDeferClerkOnWeb("/u/demo")).toBe(false);
  });
});

describe("shouldUseGuestWebShell", () => {
  it("全タブ preview を guest シェルと判定", () => {
    expect(shouldUseGuestWebShell("/")).toBe(true);
    expect(shouldUseGuestWebShell("/checkin")).toBe(true);
    expect(shouldUseGuestWebShell("/events")).toBe(true);
    expect(shouldUseGuestWebShell("/u/demo")).toBe(true);
  });

  it("Clerk セッション hint があれば guest シェルにしない", () => {
    const storage = {
      length: 1,
      key: (i: number) => (i === 0 ? "__clerk_db_jwt" : null),
      getItem: () => null,
    };
    vi.stubGlobal("window", { localStorage: storage });
    expect(shouldUseGuestWebShell("/checkin")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("USER_INFO_KEY があれば guest シェルにしない", () => {
    const storage = {
      length: 0,
      key: () => null,
      getItem: (key: string) => (key === "manus-runtime-user-info" ? "{}" : null),
    };
    vi.stubGlobal("window", { localStorage: storage, document: { cookie: "" } });
    expect(hasClerkSessionHint()).toBe(true);
    expect(shouldUseGuestWebShell("/")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("sign-in は guest シェルにしない", () => {
    expect(shouldUseGuestWebShell("/sign-in")).toBe(false);
  });
});

describe("shouldDeferTrpcOnGuestWeb", () => {
  it("トップだけ tRPC を defer", () => {
    expect(shouldDeferTrpcOnGuestWeb("/")).toBe(true);
    expect(shouldDeferTrpcOnGuestWeb("/index")).toBe(true);
    expect(shouldDeferTrpcOnGuestWeb("/events")).toBe(false);
  });
});

describe("isGuestAppWebRoute", () => {
  it("タブルートを guest アプリルートと判定", () => {
    expect(isGuestAppWebRoute("/map")).toBe(true);
    expect(isGuestAppWebRoute("/sign-in")).toBe(false);
  });
});
