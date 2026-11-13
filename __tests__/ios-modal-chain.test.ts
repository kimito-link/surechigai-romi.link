/**
 * iOS では Modal を閉じている途中に別の Modal を出すと表示が捨てられる。
 * 2026-11-13 実機 555 でサイドバーの「ログアウト」が無反応だった。
 * 封筒 → 通報、足あと → メモ、メニュー → ログアウト確認 の3か所が待ち合わせているか見る。
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(__dirname, "..", rel), "utf8");

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

describe("runAfterModalDismiss", () => {
  afterEach(() => vi.useRealTimers());
  it("iOS では閉じ終わるまで待ってから開く", async () => {
    vi.useFakeTimers();
    const { runAfterModalDismiss, IOS_MODAL_DISMISS_WAIT_MS } = await import("../lib/after-modal-dismiss");
    const open = vi.fn();
    runAfterModalDismiss(open);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(IOS_MODAL_DISMISS_WAIT_MS);
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe("Modal から Modal へつなぐ箇所", () => {
  it("封筒 → 通報", () => {
    expect(read("components/post/post-authenticated-screen.tsx")).toContain(
      "runAfterModalDismiss(() => setReportModalVisible(true))",
    );
  });
  it("足あと → メモ", () => {
    expect(read("components/organisms/web-trail-map.tsx")).toContain("runAfterModalDismiss(() => setNotePoint(p))");
  });
  it("メニュー → ログアウト確認（iOS はメニューの onDismiss で開く）", () => {
    const src = read("components/organisms/global-menu.tsx");
    expect(src).toContain("onDismiss={handleMenuDismiss}");
    expect(src).toMatch(/Platform\.OS === "ios"\) \{\s*pendingLogoutConfirm\.current = true;\s*onClose\(\);/);
  });
});
