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
});
