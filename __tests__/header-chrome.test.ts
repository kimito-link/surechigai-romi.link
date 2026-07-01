import { describe, it, expect } from "vitest";
import {
  computeTabHeaderSpacerHeight,
  HEADER_NARROW_ACCOUNT_EXTRA,
  HEADER_NARROW_LOGIN_EXTRA,
} from "@/lib/layout/header-chrome";
import { SCREEN_CONTEXT_BAR_MAX_HEIGHT } from "@/theme/tokens";

const COMPACT_CHROME = 68;
const FULL_CHROME = 124;

describe("computeTabHeaderSpacerHeight", () => {
  it("狭幅 + ログイン済み + コンテキストバーで2段ヘッダー分を確保", () => {
    expect(
      computeTabHeaderSpacerHeight({
        variant: "compact",
        hasContextBar: true,
        windowWidth: 390,
        hasLoggedInAccountRow: true,
      }),
    ).toBe(COMPACT_CHROME + HEADER_NARROW_ACCOUNT_EXTRA + SCREEN_CONTEXT_BAR_MAX_HEIGHT);
  });

  it("広幅ではアカウント2段目を加算しない", () => {
    expect(
      computeTabHeaderSpacerHeight({
        variant: "compact",
        hasContextBar: true,
        windowWidth: 768,
        hasLoggedInAccountRow: true,
      }),
    ).toBe(COMPACT_CHROME + SCREEN_CONTEXT_BAR_MAX_HEIGHT);
  });

  it("未ログイン狭幅 + ログインボタン2段目", () => {
    expect(
      computeTabHeaderSpacerHeight({
        variant: "compact",
        windowWidth: 360,
        hasLoginButtonRow: true,
      }),
    ).toBe(COMPACT_CHROME + HEADER_NARROW_LOGIN_EXTRA);
  });

  it("full variant は post 画面用の高さ", () => {
    expect(
      computeTabHeaderSpacerHeight({
        variant: "full",
        hasContextBar: true,
        windowWidth: 390,
        hasLoggedInAccountRow: true,
      }),
    ).toBe(FULL_CHROME + HEADER_NARROW_ACCOUNT_EXTRA + SCREEN_CONTEXT_BAR_MAX_HEIGHT);
  });
});
