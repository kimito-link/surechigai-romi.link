/**
 * シェア導線のタイムアウト機構の回帰テスト。
 *
 * 背景(2026-08-04 実機report): 「Xで共有」「前の場所を連続で共有」で、シェア用に開いた
 * 空タブが about:blank + 「共有画面を準備しています…」のまま固まる報告があった。
 * 原因は共有リンク発行(ogp.getOrCreateShareSlug)に上限が無く、失敗ではなく「遅い/返らない」
 * ときに catch へ落ちず、タブを閉じる処理に到達しなかったこと。
 * ここでは「遅いだけの Promise が必ず ShareTimeoutError で終わる」ことを固定する。
 */
import { describe, it, expect, vi } from "vitest";

// lib/share.ts は react-native / expo-haptics を読むため、テストでは軽量スタブに差し替える。
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Share: { share: vi.fn(), sharedAction: "sharedAction" },
  Linking: { openURL: vi.fn() },
}));
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));
// lib/share.ts が Instagram 用コピーで expo-clipboard を静的 import しているため、
// ネイティブモジュールの読み込みを避けるモックが要る（2026-08-15 追加）
vi.mock("expo-clipboard", () => ({ setStringAsync: vi.fn() }));

const { withShareTimeout, ShareTimeoutError, SHARE_SLUG_TIMEOUT_MS } = await import(
  "@/lib/share"
);

describe("withShareTimeout", () => {
  it("時間内に解決すればその値を返す", async () => {
    await expect(withShareTimeout(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });

  it("解決しない Promise は ShareTimeoutError で必ず終わる(about:blank 固まりの再発防止)", async () => {
    vi.useFakeTimers();
    try {
      // 永遠に解決しない = 実機で観測された「返ってこない」状態
      const stuck = new Promise<string>(() => {});
      const raced = withShareTimeout(stuck, 8000);
      const assertion = expect(raced).rejects.toBeInstanceOf(ShareTimeoutError);
      await vi.advanceTimersByTimeAsync(8000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("元の失敗はそのまま伝播する(タイムアウトで握り潰さない)", async () => {
    const boom = new Error("network down");
    await expect(withShareTimeout(Promise.reject(boom), 1000)).rejects.toBe(boom);
  });

  it("既定のタイムアウトは待たせ過ぎない範囲に収める", () => {
    expect(SHARE_SLUG_TIMEOUT_MS).toBeLessThanOrEqual(10000);
  });
});
