import { describe, it, expect } from "vitest";
import { HEADER_USER_BUTTON_PROPS } from "@/lib/header-user-button-props";

/**
 * ヘッダー UserButton の props を恒久固定する（設計 docs/HEADER-USERBUTTON-DESIGN.md C-2）。
 * 守るのは「auto=x を一切混ぜない」「サインアウトは /logout の掃除経路へ」「管理は /mypage」。
 * lib/clerk-route.ts の柵と対で、UserButton 由来の遷移が X 自動クリックを誘発しないよう固定する。
 */
describe("HEADER_USER_BUTTON_PROPS", () => {
  it("どの値にも auto=x を含まない（AutoAdvanceToX を誘発しない）", () => {
    const serialized = JSON.stringify(HEADER_USER_BUTTON_PROPS);
    expect(serialized).not.toContain("auto=x");
    expect(serialized).not.toContain("auto%3Dx");
  });

  it("サインアウト後は /logout（既存のログアウト演出＋ローカル掃除へ合流）", () => {
    expect(HEADER_USER_BUTTON_PROPS.afterSignOutUrl).toBe("/logout");
  });

  it("アカウント管理は Clerk 標準モーダル（既定・kimito.link と同じ体験）", () => {
    // userProfileMode / userProfileUrl を持たない＝既定のモーダル表示に委ねる。
    expect("userProfileMode" in HEADER_USER_BUTTON_PROPS).toBe(false);
    expect("userProfileUrl" in HEADER_USER_BUTTON_PROPS).toBe(false);
  });

  it("multi-session の追加/全サインアウトを UI から隠す防御（X 制約の同一垢ループ回避）", () => {
    const els = HEADER_USER_BUTTON_PROPS.appearance.elements;
    expect(els.userButtonPopoverActionButton__addAccount).toEqual({ display: "none" });
    expect(els.userButtonPopoverActionButton__signOutAll).toEqual({ display: "none" });
  });
});
