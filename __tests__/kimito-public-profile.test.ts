import { describe, it, expect } from "vitest";
import {
  parseFollowersFromKimitoHtml,
  parseKimitoPublicProfileHtml,
  parseUsernameFromKimitoTitle,
} from "../lib/kimito-public-profile.js";

describe("kimito public profile parse", () => {
  it("タイトルから @streamerfunch を抽出", () => {
    expect(
      parseUsernameFromKimitoTitle("君斗りんく＠クリエイター応援 (@streamerfunch) | kimito.link"),
    ).toBe("streamerfunch");
  });

  it("HTML からフォロワー数 728 を抽出", () => {
    expect(parseFollowersFromKimitoHtml("728フォロワー")).toBe(728);
    expect(parseFollowersFromKimitoHtml("<strong>728</strong>フォロワー")).toBe(728);
  });

  it("kimito.link 公開 HTML 相当からプロフィールを組み立てる", () => {
    const html = `<!DOCTYPE html><html><head>
      <title>君斗りんく＠クリエイター応援 (@streamerfunch) | kimito.link</title>
      <meta property="og:title" content="君斗りんく＠クリエイター応援 (@streamerfunch)" />
      <meta property="og:image" content="https://img.clerk.com/preview.png" />
      </head><body>728フォロワー</body></html>`;
    const profile = parseKimitoPublicProfileHtml(html, "streamerfunch");
    expect(profile?.username).toBe("streamerfunch");
    expect(profile?.displayName).toContain("君斗りんく");
    expect(profile?.profileImage).toBe("https://img.clerk.com/preview.png");
    expect(profile?.followersCount).toBe(728);
    expect(profile?.profileUrl).toBe("https://kimito.link/streamerfunch/");
  });
});
