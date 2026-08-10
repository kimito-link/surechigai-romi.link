import { describe, it, expect } from "vitest";
import { HEADER_USER_BUTTON_PROPS } from "@/lib/header-user-button-props";

/**
 * ヘッダー UserButton の props を恒久固定する（設計 docs/MULTI-SESSION-X-SWITCH-DESIGN.md）。
 * 守るのは「auto=x を一切混ぜない」「全サインアウトは /logout の掃除経路」「単垢サインアウト/切替は
 * 残る垢を巻き添えにせず / へ」「管理は Clerk 標準モーダル」。multi-session（複数Xアカウント切替）を
 * 活かすため、以前の addAccount/signOutAll 隠しは撤去済み。
 */
describe("HEADER_USER_BUTTON_PROPS", () => {
  it("どの値にも auto=x を含まない（AutoAdvanceToX を誘発しない）", () => {
    const serialized = JSON.stringify(HEADER_USER_BUTTON_PROPS);
    expect(serialized).not.toContain("auto=x");
    expect(serialized).not.toContain("auto%3Dx");
  });

  it("全サインアウトは /logout（既存のログアウト演出＋ローカル掃除へ合流）", () => {
    expect(HEADER_USER_BUTTON_PROPS.afterSignOutUrl).toBe("/logout");
  });

  it("単垢サインアウトは / へ（残る垢を /logout の全消しで巻き添えにしない）", () => {
    expect(HEADER_USER_BUTTON_PROPS.afterMultiSessionSingleSignOutUrl).toBe("/");
  });

  it("別垢への切替は / へ着地（ヘッダー/mypage/記録先が新垢に切り替わる）", () => {
    expect(HEADER_USER_BUTTON_PROPS.afterSwitchSessionUrl).toBe("/");
  });

  it("アカウント管理は Clerk 標準モーダル（既定・kimito.link と同じ体験）", () => {
    expect("userProfileMode" in HEADER_USER_BUTTON_PROPS).toBe(false);
    expect("userProfileUrl" in HEADER_USER_BUTTON_PROPS).toBe(false);
  });

  it("multi-session の追加/切替/全サインアウトを隠さない（撤去済み）", () => {
    const els = HEADER_USER_BUTTON_PROPS.appearance.elements as Record<string, unknown>;
    expect("userButtonPopoverActionButton__addAccount" in els).toBe(false);
    expect("userButtonPopoverActionButton__signOutAll" in els).toBe(false);
  });
});
