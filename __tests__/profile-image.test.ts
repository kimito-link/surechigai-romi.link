import { describe, expect, it } from "vitest";
import {
  buildTwitterAvatarFallbackUrl,
  isKimitoGeneratedProfileImage,
  pickBestProfileImage,
  resolveListProfileImage,
} from "../lib/profile-image.js";

describe("profile-image", () => {
  it("kimito OGP URL を検出する", () => {
    expect(
      isKimitoGeneratedProfileImage(
        "https://kimito.link/streamerfunch/opengraph-image-blhyuj/profile",
      ),
    ).toBe(true);
    expect(
      isKimitoGeneratedProfileImage(
        "https://pbs.twimg.com/profile_images/1/abc_normal.jpg",
      ),
    ).toBe(false);
  });

  it("X アバターを kimito OGP より優先する", () => {
    const picked = pickBestProfileImage(
      "https://kimito.link/user/opengraph-image/profile",
      "https://pbs.twimg.com/profile_images/1/abc_normal.jpg",
    );
    expect(picked).toBe("https://pbs.twimg.com/profile_images/1/abc_400x400.jpg");
  });

  it("kimito OGP のみのとき null を返す", () => {
    expect(
      pickBestProfileImage(
        "https://kimito.link/streamerfunch/opengraph-image-blhyuj/profile",
      ),
    ).toBeNull();
  });

  it("resolveListProfileImage は unavatar にフォールバックする", () => {
    expect(
      resolveListProfileImage(
        "streamerfunch",
        "https://kimito.link/streamerfunch/opengraph-image/profile",
      ),
    ).toBe("https://unavatar.io/x/streamerfunch");
  });

  it("Clerk プロキシ（中身が kimito OGP）も unavatar にフォールバックする", () => {
    expect(
      resolveListProfileImage(
        "streamerfunch",
        "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2tpbWl0by5saW5rIn0",
      ),
    ).toBe("https://unavatar.io/x/streamerfunch");
  });

  it("X CDN 実画像はそのまま使う", () => {
    expect(
      resolveListProfileImage(
        "streamerfunch",
        "https://img.clerk.com/proxy",
        "https://pbs.twimg.com/profile_images/1/abc_normal.jpg",
      ),
    ).toBe("https://pbs.twimg.com/profile_images/1/abc_400x400.jpg");
  });

  it("buildTwitterAvatarFallbackUrl を生成する", () => {
    expect(buildTwitterAvatarFallbackUrl("@streamerfunch")).toBe(
      "https://unavatar.io/x/streamerfunch",
    );
  });
});
