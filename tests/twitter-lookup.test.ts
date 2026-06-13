import { describe, it, expect } from "vitest";

// Twitterユーザー名パーサーのテスト

describe("Twitter Username Parser", () => {
  // ユーザー名をクリーンアップする関数（サーバー側と同じロジック）
  function parseTwitterUsername(input: string): string {
    let cleanUsername = input.trim();
    
    // URL形式の場合（https://x.com/username または https://twitter.com/username）
    const urlMatch = cleanUsername.match(/(?:https?:\/\/)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
    if (urlMatch) {
      cleanUsername = urlMatch[1];
    }
    
    // @を削除
    cleanUsername = cleanUsername.replace(/^@/, "");
    
    return cleanUsername;
  }

  describe("@形式の入力", () => {
    it("should parse @username format", () => {
      expect(parseTwitterUsername("@idolfunch")).toBe("idolfunch");
    });

    it("should handle username without @", () => {
      expect(parseTwitterUsername("idolfunch")).toBe("idolfunch");
    });

    it("should trim whitespace", () => {
      expect(parseTwitterUsername("  @idolfunch  ")).toBe("idolfunch");
    });
  });

  describe("URL形式の入力", () => {
    it("should parse https://x.com/username format", () => {
      expect(parseTwitterUsername("https://x.com/idolfunch")).toBe("idolfunch");
    });

    it("should parse https://twitter.com/username format", () => {
      expect(parseTwitterUsername("https://twitter.com/idolfunch")).toBe("idolfunch");
    });

    it("should parse http://x.com/username format", () => {
      expect(parseTwitterUsername("http://x.com/idolfunch")).toBe("idolfunch");
    });

    it("should parse URL without protocol", () => {
      expect(parseTwitterUsername("x.com/idolfunch")).toBe("idolfunch");
    });

    it("should parse twitter.com URL without protocol", () => {
      expect(parseTwitterUsername("twitter.com/idolfunch")).toBe("idolfunch");
    });
  });

  describe("エッジケース", () => {
    it("should handle empty string", () => {
      expect(parseTwitterUsername("")).toBe("");
    });

    it("should handle whitespace only", () => {
      expect(parseTwitterUsername("   ")).toBe("");
    });

    it("should handle username with numbers", () => {
      expect(parseTwitterUsername("@user123")).toBe("user123");
    });

    it("should handle username with underscore", () => {
      expect(parseTwitterUsername("@user_name")).toBe("user_name");
    });
  });
});

describe("Companion Data with Twitter Profile", () => {
  it("should create companion with Twitter profile data", () => {
    const twitterProfile = {
      id: "123456789",
      name: "君斗りんく",
      username: "idolfunch",
      profileImage: "https://pbs.twimg.com/profile_images/xxx/xxx_400x400.jpg",
    };

    const companion = {
      id: Date.now().toString(),
      displayName: twitterProfile.name,
      twitterUsername: twitterProfile.username,
      twitterId: twitterProfile.id,
      profileImage: twitterProfile.profileImage,
    };

    expect(companion.displayName).toBe("君斗りんく");
    expect(companion.twitterUsername).toBe("idolfunch");
    expect(companion.twitterId).toBe("123456789");
    expect(companion.profileImage).toContain("_400x400");
  });

  it("should create companion without Twitter profile", () => {
    const companion = {
      id: Date.now().toString(),
      displayName: "友人A",
      twitterUsername: "",
      twitterId: undefined,
      profileImage: undefined,
    };

    expect(companion.displayName).toBe("友人A");
    expect(companion.twitterUsername).toBe("");
    expect(companion.twitterId).toBeUndefined();
    expect(companion.profileImage).toBeUndefined();
  });
});

describe("Profile Image URL Handling", () => {
  it("should convert _normal to _400x400 for high resolution", () => {
    const normalUrl = "https://pbs.twimg.com/profile_images/123/abc_normal.jpg";
    const highResUrl = normalUrl.replace("_normal", "_400x400");
    
    expect(highResUrl).toBe("https://pbs.twimg.com/profile_images/123/abc_400x400.jpg");
  });

  it("should handle URL without _normal", () => {
    const url = "https://pbs.twimg.com/profile_images/123/abc.jpg";
    const result = url.replace("_normal", "_400x400");
    
    expect(result).toBe("https://pbs.twimg.com/profile_images/123/abc.jpg");
  });
});
