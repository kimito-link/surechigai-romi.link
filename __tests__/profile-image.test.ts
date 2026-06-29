import { describe, expect, it } from "vitest";
import {
  isKimitoGeneratedProfileImage,
  pickBestProfileImage,
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
});
