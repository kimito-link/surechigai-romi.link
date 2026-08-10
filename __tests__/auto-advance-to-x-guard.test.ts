import { describe, it, expect } from "vitest";
import { shouldAutoAdvanceToX } from "@/lib/auto-advance-to-x-guard";

/**
 * X 自動クリックの発火判定を固定する（設計 docs/HEADER-USERBUTTON-DESIGN.md C-1）。
 * 肝は「ログイン済みなら発火しない」= UserButton 経由で /sign-in?auto=x に戻っても
 * X 自動クリックの認証ループに入らないこと。
 */
describe("shouldAutoAdvanceToX", () => {
  const base = { hasParam: true, isSso: false, isAuthReady: true, hasUser: false };

  it("未ログイン・param あり・sso でない・準備完了なら発火する", () => {
    expect(shouldAutoAdvanceToX(base)).toBe(true);
  });

  it("ログイン済みなら発火しない（ループの根を絶つ）", () => {
    expect(shouldAutoAdvanceToX({ ...base, hasUser: true })).toBe(false);
  });

  it("auto=x param が無ければ発火しない", () => {
    expect(shouldAutoAdvanceToX({ ...base, hasParam: false })).toBe(false);
  });

  it("sso コールバック中は発火しない", () => {
    expect(shouldAutoAdvanceToX({ ...base, isSso: true })).toBe(false);
  });

  it("Clerk 未確定なら発火しない（X ボタンがまだ無い）", () => {
    expect(shouldAutoAdvanceToX({ ...base, isAuthReady: false })).toBe(false);
  });
});
