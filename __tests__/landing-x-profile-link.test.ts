/**
 * 着地ページ /u/<slug> から投稿者の X プロフィールへ戻れることを守る。
 *
 * このテストが守る事故（2026-08-15 ユーザー報告）:
 * 「X アプリなのにちゃんと X アプリに戻れる導線がない」。交流は X に委譲する設計
 * （CLAUDE.md 設計原則4）なのに、着地ページから X へ出る導線が0件だった。
 *
 * ★ホワイトリスト漏れは無言で false を返す（external-links.ts:34-36）。
 *   押しても何も起きない状態を作った前科があるため、
 *   **grep ではなく戻り値で**「通ること」と「弾かれること」の両方を固定する。
 *   許可リストから x.com を外したら、このテストは必ず落ちなければならない。
 */
import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { canOpenURL: vi.fn(), openURL: vi.fn() },
}));

const { openTwitterProfile, openExternalUrl } = await import(
  "@/lib/navigation/external-links"
);

const originalOpen = globalThis.window?.open;

afterEach(() => {
  if (globalThis.window) globalThis.window.open = originalOpen as typeof window.open;
  vi.restoreAllMocks();
});

/** window.open を差し替えて「実際に開かれたURL」を捕まえる */
function captureOpenedUrl(): { calls: string[] } {
  const calls: string[] = [];
  const open: typeof window.open = (url) => {
    if (typeof url === "string") calls.push(url);
    return {} as Window;
  };
  globalThis.window = { open } as unknown as Window & typeof globalThis;
  return { calls };
}

describe("着地ページから X プロフィールへ戻る導線", () => {
  it("openTwitterProfile は true を返す（ホワイトリストを通過する）", async () => {
    captureOpenedUrl();

    // x.com / twitter.com を許可リストから外すとここが false になって落ちる
    await expect(openTwitterProfile("yukkurilink")).resolves.toBe(true);
  });

  it("開かれる URL が投稿者のプロフィールを指す", async () => {
    const captured = captureOpenedUrl();

    await openTwitterProfile("yukkurilink");

    expect(captured.calls).toHaveLength(1);
    expect(captured.calls[0]).toContain("yukkurilink");
    expect(captured.calls[0]).toMatch(/^https:\/\/(www\.)?(twitter|x)\.com\//);
  });

  it("先頭の @ が付いていても正しく開ける", async () => {
    const captured = captureOpenedUrl();

    await openTwitterProfile("@yukkurilink");

    // @ が URL に混入すると 404 のプロフィールを開いてしまう
    expect(captured.calls[0]).not.toContain("@");
    expect(captured.calls[0]).toContain("yukkurilink");
  });

  it("ホワイトリストに無いドメインは false を返し、開かない（壊して落ちる確認）", async () => {
    const captured = captureOpenedUrl();

    await expect(openExternalUrl("https://evil.example.com/phish")).resolves.toBe(false);
    expect(captured.calls).toHaveLength(0);
  });

  it("https 以外は許可ドメインでも false", async () => {
    const captured = captureOpenedUrl();

    await expect(openExternalUrl("http://x.com/yukkurilink")).resolves.toBe(false);
    expect(captured.calls).toHaveLength(0);
  });
});
