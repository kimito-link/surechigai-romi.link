/**
 * Instagram 用のリンクコピーを守る。
 *
 * ★なぜコピーなのか（技術的制約・2026-08-15 にユーザーへ説明済み）:
 *   Instagram には X/Threads のような Web Intent が無く、フィード投稿の本文に
 *   貼ったURLはリンクとして機能しない（プロフィール欄かストーリーズのみ）。
 *   Graph API の投稿も個人アカウントには開放されていない。
 *   よって「ワンタップで投稿画面」は作れず、ユーザー指示のとおり
 *   「アドレスを貼る程度」＝手貼り用のコピーに留める。
 *
 * ★文面は X/Threads と共通関数から作る。3導線で文言がずれないようにするため。
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const setStringAsync = vi.fn(async () => true);

vi.mock("expo-clipboard", () => ({ setStringAsync }));
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Share: { share: vi.fn() },
  Linking: { openURL: vi.fn(), canOpenURL: vi.fn() },
}));
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));

const { copyShareLinkForInstagram, buildMyLocationShareText } = await import("@/lib/share");

beforeEach(() => {
  setStringAsync.mockClear();
  setStringAsync.mockImplementation(async () => true);
});

describe("buildMyLocationShareText（3導線で共通の文面）", () => {
  it("地名があれば本文に含める", () => {
    const { text } = buildMyLocationShareText("茅野市");

    expect(text).toContain("茅野市");
  });

  it("主役コピーを必ず含む", () => {
    expect(buildMyLocationShareText("茅野市").text).toContain("会いたい君がいる現在地");
    expect(buildMyLocationShareText(undefined).text).toContain("会いたい君がいる現在地");
  });

  it("地名が無くても本文が成立する", () => {
    const { text } = buildMyLocationShareText(undefined);

    expect(text.trim().length).toBeGreaterThan(0);
    expect(text).not.toContain("undefined");
  });

  it("ハッシュタグを返す", () => {
    expect(buildMyLocationShareText("茅野市").hashtags).toContain("君斗りんくのすれ違ひ通信");
  });
});

describe("copyShareLinkForInstagram", () => {
  it("本文と共有URLの両方をコピーする", async () => {
    const url = "https://surechigai.kimito.link/u/YutsbacFpeJ4";

    await copyShareLinkForInstagram(url, "茅野市");

    expect(setStringAsync).toHaveBeenCalledTimes(1);
    const copied = (setStringAsync.mock.calls[0] as unknown[])[0] as string;
    expect(copied).toContain(url);
    expect(copied).toContain("茅野市");
  });

  it("成功したら true", async () => {
    await expect(
      copyShareLinkForInstagram("https://surechigai.kimito.link/u/abc", "東京都"),
    ).resolves.toBe(true);
  });

  it("クリップボードが失敗したら false（画面で案内できるようにする）", async () => {
    setStringAsync.mockImplementation(async () => {
      throw new Error("clipboard blocked");
    });

    await expect(
      copyShareLinkForInstagram("https://surechigai.kimito.link/u/abc", "東京都"),
    ).resolves.toBe(false);
  });
});
