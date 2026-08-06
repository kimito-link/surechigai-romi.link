import { describe, it, expect } from "vitest";
import { extractTwitterProfileFromClerkUser } from "../lib/clerk-twitter-profile.js";

describe("extractTwitterProfileFromClerkUser", () => {
  it("Clerk の X 連携から streamerfunch を抽出する", () => {
    const profile = extractTwitterProfileFromClerkUser({
      id: "user_abc",
      fullName: "君斗りんく@クリエイター応援",
      imageUrl: "https://img.clerk.com/a.png",
      externalAccounts: [
        {
          provider: "oauth_x",
          username: "streamerfunch",
          providerUserId: "987654321",
          imageUrl: "https://pbs.twimg.com/a.png",
        },
      ],
    });

    expect(profile).not.toBeNull();
    expect(profile!.twitterUsername).toBe("streamerfunch");
    expect(profile!.twitterId).toBe("987654321");
    expect(profile!.displayName).toBe("君斗りんく@クリエイター応援");
  });

  it("username が無効なら null", () => {
    const profile = extractTwitterProfileFromClerkUser({
      fullName: "君斗りんく@クリエイター応援",
      externalAccounts: [],
    });
    expect(profile).toBeNull();
  });

  /**
   * Sign in with Apple を主導線にした（2026-08-05 / Guideline 4.8）ことで現実に通る経路。
   * X 連携が無いユーザーの Apple/Google アカウントを「X アカウント」として扱ってはいけない。
   * 誤って採用すると、Apple の非公開リレー名などで公開URL(/u/<slug>)や
   * OGP のハンドル表示が作られ、本人と無関係の値が公開される。
   */
  it("Appleのみのユーザーを X 扱いしない（他プロバイダを掴まない）", () => {
    const profile = extractTwitterProfileFromClerkUser({
      id: "user_apple",
      fullName: "山田太郎",
      externalAccounts: [
        {
          provider: "oauth_apple",
          username: "kimito_apple_relay",
          providerUserId: "001234.abcdef",
        },
      ],
    });
    expect(profile).toBeNull();
  });

  it("Googleのみのユーザーも X 扱いしない", () => {
    const profile = extractTwitterProfileFromClerkUser({
      externalAccounts: [
        { provider: "oauth_google", username: "someone", providerUserId: "g-1" },
      ],
    });
    expect(profile).toBeNull();
  });

  /**
   * Apple と X を両方つないでいる場合は、必ず X 側を採用する。
   * 配列の順序に依存して Apple を拾うと、アカウント切り替え時に追従しない。
   */
  it("Apple と X が併存するとき X を選ぶ（配列順に依存しない）", () => {
    const profile = extractTwitterProfileFromClerkUser({
      externalAccounts: [
        { provider: "oauth_apple", username: "apple_relay", providerUserId: "a-1" },
        { provider: "oauth_x", username: "streamerfunch", providerUserId: "987654321" },
      ],
    });
    expect(profile).not.toBeNull();
    expect(profile!.twitterUsername).toBe("streamerfunch");
    expect(profile!.twitterId).toBe("987654321");
  });

  /**
   * 連携が壊れている（未検証）X アカウントは採用しない。
   * 壊れた値で公開URLを作ると、本人がログインし直しても直らない状態になる
   * （kimitolink-linktree で実機再現した症状。resolveXUsername と同じ判断）。
   */
  it("未検証のX連携は採用しない", () => {
    const profile = extractTwitterProfileFromClerkUser({
      externalAccounts: [
        {
          provider: "oauth_x",
          username: "broken_link",
          providerUserId: "x-1",
          verification: { status: "unverified" },
        },
      ],
    });
    expect(profile).toBeNull();
  });

  /**
   * X アカウントを切り替えたら、新しいハンドルに追従すること。
   * clerkUser.username は「そのアプリのユーザー名」で、後から別の X で入り直しても
   * 更新されないことがあるため、externalAccounts 側を優先しなければならない。
   */
  it("Xアカウント切り替え後は externalAccounts のハンドルに追従する", () => {
    const profile = extractTwitterProfileFromClerkUser({
      username: "old_handle", // 初回サインアップ時のまま残っている値
      externalAccounts: [
        { provider: "oauth_x", username: "new_handle", providerUserId: "x-2" },
      ],
    });
    expect(profile!.twitterUsername).toBe("new_handle");
  });
});
