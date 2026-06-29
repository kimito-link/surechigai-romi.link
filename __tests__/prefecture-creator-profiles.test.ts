import { describe, expect, it } from "vitest";
import { toPrefectureCreatorListProfile } from "../modules/encounter/db/prefecture-creator-profiles.js";

describe("toPrefectureCreatorListProfile", () => {
  it("キャッシュの displayName / handle / 画像を優先する", () => {
    const profile = toPrefectureCreatorListProfile(
      {
        id: 1,
        name: "君斗りんく@クリエイター応援",
        openId: "clerk:abc",
        shareSlug: "slug123456789",
      },
      {
        twitterUsername: "streamerfunch",
        twitterId: "111",
        displayName: "ストリーマーファンチ",
        profileImage: "https://pbs.twimg.com/photo.jpg",
        followersCount: 728,
      },
    );

    expect(profile.displayName).toBe("ストリーマーファンチ");
    expect(profile.twitterHandle).toBe("streamerfunch");
    expect(profile.profileImage).toBe("https://pbs.twimg.com/photo.jpg");
  });

  it("キャッシュが無いとき users.name を表示名に使う", () => {
    const profile = toPrefectureCreatorListProfile(
      {
        id: 2,
        name: "たぬ姉",
        openId: "clerk:xyz",
        shareSlug: null,
      },
      null,
    );

    expect(profile.displayName).toBe("たぬ姉");
    expect(profile.twitterHandle).toBeNull();
  });
});
