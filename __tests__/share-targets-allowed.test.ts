/**
 * 共有ボタンの飛び先が、外部リンクの許可リストを通ることを守る。
 *
 * 背景（2026-08-21 実測で発覚）:
 *   `lib/share.ts` の `buildThreadsIntentUrl` は
 *   `https://www.threads.com/intent/post?...` を組み立てていたのに、
 *   `ALLOWED_EXTERNAL_DOMAINS` に **threads が一度も入っていなかった**。
 *   `openExternalUrl` は許可外ドメインで**無言で false** を返すため、
 *   **Threads の共有ボタンは押しても何も起きない**状態だった。
 *   ユーザーからも「thread も（反映できない）」という報告が出ていた。
 *
 * ★この穴が見逃されてきた理由:
 *   - 型もテストも lint も通る（URLは文字列として正しい）
 *   - 共有まわりのテストは60件あったが、**組み立てたURLが実際に開けるか**を
 *     見ていなかった（文言やパラメータの検証に寄っていた）
 *   - 許可リストは「追加し忘れても何も言わない」形をしている
 *
 * ★ここでは「許可リストに文字列があるか」ではなく、
 *   **実際の判定関数 `getAllowedDomains()` の戻り値で照合する**。
 *   grep で書くと、許可リストから外しても緑のままになる
 *   （このリポジトリで実際に起きた。2026-08-10）。
 */
import { describe, it, expect, vi } from "vitest";

// external-links.ts は react-native を読むので最小スタブが要る
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { canOpenURL: vi.fn(), openURL: vi.fn() },
}));

/** 共有ボタンが実際に開こうとする先。増えたらここに足す。 */
const SHARE_TARGETS = [
  { 用途: "Xへ投稿", url: "https://twitter.com/intent/tweet?text=a&url=b" },
  { 用途: "Threadsへ投稿", url: "https://www.threads.com/intent/post?text=a&url=b" },
  { 用途: "Xのフォロー", url: "https://x.com/intent/follow?screen_name=a" },
  { 用途: "ライブ配信を見る", url: "https://www.youtube.com/watch?v=a" },
  { 用途: "iOSアプリDL", url: "https://apps.apple.com/app/id123" },
  { 用途: "AndroidアプリDL", url: "https://play.google.com/store/apps/details?id=a" },
];

async function allowedHosts(): Promise<readonly string[]> {
  const { getAllowedDomains } = await import("@/lib/navigation/external-links");
  return getAllowedDomains();
}

function isAllowed(url: string, allowed: readonly string[]): boolean {
  const host = new URL(url).hostname;
  return allowed.some(
    (d) => host === d || host === `www.${d}` || host.endsWith(`.${d}`),
  );
}

describe("共有先が許可リストを通る（無言 false を作らない）", () => {
  it.each(SHARE_TARGETS)("$用途 は開ける", async ({ url }) => {
    const allowed = await allowedHosts();
    expect(isAllowed(url, allowed), `${new URL(url).hostname} が許可リストに無い`).toBe(true);
  });

  it("Threads は .com / .net の両方を許可する（移行の取りこぼしを防ぐ）", async () => {
    const allowed = await allowedHosts();

    expect(isAllowed("https://www.threads.com/intent/post?text=a", allowed)).toBe(true);
    expect(isAllowed("https://www.threads.net/intent/post?text=a", allowed)).toBe(true);
  });

  it("許可していないドメインは通さない（リストが機能している証明）", async () => {
    const allowed = await allowedHosts();

    // このテスト自体が「何でも true を返す」壊れ方をしていないことの確認
    expect(isAllowed("https://example.com/", allowed)).toBe(false);
    expect(isAllowed("https://evil-phishing-site.test/", allowed)).toBe(false);
  });
});
