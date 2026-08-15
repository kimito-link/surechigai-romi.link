/**
 * 集まりの「友達を誘う」文面とリンクを守る。
 *
 * 背景（2026-08-15 ユーザー要望）:
 * 既存の「𝕏でシェア」(events-event-card.tsx:87) は文面だけで**URLが無く**、
 * 見た人がアプリへ来る導線が無かった。誘われた側が辿り着けないものは「誘い」ではない。
 *
 * ★最重要の制約: リンク先は**実在するルート**でなければならない。
 *   このアプリに /event/[id] の実画面は存在せず（ルート定数だけが旧テンプレートの
 *   名残で残っている）、そこへ誘うと相手が not-found に落ちる。
 *   実際 host-events-summary.tsx が同じ罠を踏んでいて、本タスクで修正した。
 */
import { describe, expect, it, vi } from "vitest";

const shareMock = vi.fn(async () => ({ action: "sharedAction" }));

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Share: { share: shareMock, sharedAction: "sharedAction" },
}));

const {
  buildEventInviteText,
  buildEventInviteMessage,
  eventInviteUrl,
  shareEventInvite,
} = await import("@/lib/events/event-invite");

const base = {
  title: "夜の散歩オフ",
  startAt: new Date(2026, 7, 16, 19, 0), // 2026-08-16 19:00（ローカル時刻）
  prefecture: "長野県",
  venueName: "茅野駅",
};

describe("eventInviteUrl（誘われた人の着地先）", () => {
  it("実在する集まり一覧を指す", () => {
    // /event/[id] の実画面は存在しない。そこへ誘うと相手が not-found に落ちる
    expect(eventInviteUrl()).toMatch(/\/events$/);
    expect(eventInviteUrl()).not.toContain("/event/");
  });

  it("https の本番ドメインを指す", () => {
    expect(eventInviteUrl()).toMatch(/^https:\/\//);
  });
});

describe("buildEventInviteText（誘い文の本文）", () => {
  it("タイトル・日時・場所が入る", () => {
    const text = buildEventInviteText(base);

    expect(text).toContain("夜の散歩オフ");
    expect(text).toContain("8/16 19:00");
    expect(text).toContain("長野県");
    expect(text).toContain("茅野駅");
  });

  it("オンラインなら場所は「オンライン」", () => {
    const text = buildEventInviteText({ ...base, locationType: "online" });

    expect(text).toContain("オンライン");
    expect(text).not.toContain("茅野駅");
  });

  it("場所が未設定でも文面が壊れない", () => {
    const text = buildEventInviteText({
      title: base.title,
      startAt: base.startAt,
      prefecture: null,
      venueName: null,
    });

    expect(text).toContain("場所未定");
    expect(text).not.toContain("null");
    expect(text).not.toContain("undefined");
  });

  it("日時が不正でも文面が壊れない（Invalid Date を出さない）", () => {
    const text = buildEventInviteText({ ...base, startAt: "こわれた日付" });

    expect(text).toContain("夜の散歩オフ");
    expect(text).not.toContain("Invalid Date");
    expect(text).not.toContain("NaN");
  });

  it("ISO文字列の日時も扱える（APIからは文字列で来る）", () => {
    const iso = new Date(2026, 7, 16, 19, 0).toISOString();
    const text = buildEventInviteText({ ...base, startAt: iso });

    expect(text).toContain("8/16 19:00");
  });

  it("本文自体にはURLを含めない（X/Threads は url を別パラメータで渡すため）", () => {
    expect(buildEventInviteText(base)).not.toContain("http");
  });
});

describe("差出人（doin-challenge の招待画面から採用）", () => {
  it("誘っている人の名前が入る", () => {
    const text = buildEventInviteText({ ...base, inviterName: "りんく" });

    // 誰からの誘いかで受け取り方が変わるので、差出人は文面の主役に置く
    expect(text).toContain("りんく");
    expect(text).toContain("お誘い");
  });

  it("差出人が無くても文面が成立する（未ログイン・名前未設定）", () => {
    const text = buildEventInviteText({ ...base, inviterName: null });

    expect(text).toContain("夜の散歩オフ");
    expect(text).not.toContain("null");
    expect(text).not.toContain("さんから");
  });

  it("空白だけの名前は差出人として扱わない", () => {
    const text = buildEventInviteText({ ...base, inviterName: "   " });

    expect(text).not.toContain("さんから");
  });
});

describe("shareEventInvite（OSの共有シート＝LINE等へ送る）", () => {
  it("本文とURLを渡して共有シートを開く", async () => {
    shareMock.mockClear();

    await shareEventInvite({ ...base, inviterName: "りんく" });

    expect(shareMock).toHaveBeenCalledTimes(1);
    const arg = (shareMock.mock.calls[0] as unknown[])[0] as { message: string };
    expect(arg.message).toContain("夜の散歩オフ");
    expect(arg.message).toContain(eventInviteUrl());
  });

  it("共有が完了したら true", async () => {
    shareMock.mockClear();
    shareMock.mockImplementation(async () => ({ action: "sharedAction" }));

    await expect(shareEventInvite(base)).resolves.toBe(true);
  });

  it("ユーザーが閉じたら false（コピーへ誘導できるようにする）", async () => {
    shareMock.mockClear();
    shareMock.mockImplementation(async () => ({ action: "dismissedAction" }));

    await expect(shareEventInvite(base)).resolves.toBe(false);
  });

  it("Share API が無い環境でも例外を投げない", async () => {
    shareMock.mockClear();
    shareMock.mockImplementation(async () => {
      throw new Error("not supported");
    });

    await expect(shareEventInvite(base)).resolves.toBe(false);
  });
});

describe("buildEventInviteMessage（コピー用の全文）", () => {
  it("本文とURLの両方が入る", () => {
    const msg = buildEventInviteMessage(base);

    expect(msg).toContain("夜の散歩オフ");
    expect(msg).toContain(eventInviteUrl());
  });

  it("誘われた人が辿り着けるURLで終わる", () => {
    expect(buildEventInviteMessage(base).trim()).toMatch(/\/events$/);
  });
});
