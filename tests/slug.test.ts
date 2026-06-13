/**
 * URL Slug Utilities Tests
 */
import { describe, it, expect } from "vitest";
import {
  slugify,
  createProfileSlug,
  createEventSlug,
  extractIdFromSlug,
  getCanonicalProfileUrl,
  getCanonicalEventUrl,
  isCanonicalUrl,
} from "../lib/slug";

describe("slugify", () => {
  it("should convert text to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("hello world test")).toBe("hello-world-test");
  });

  it("should remove special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("should handle Japanese characters", () => {
    expect(slugify("君斗りんく生誕祭")).toBe("君斗りんく生誕祭");
  });

  it("should handle mixed content", () => {
    expect(slugify("2024 Birthday Party")).toBe("2024-birthday-party");
  });

  it("should collapse multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("should trim leading and trailing hyphens", () => {
    expect(slugify(" hello world ")).toBe("hello-world");
  });

  it("should truncate long strings", () => {
    const longText = "a".repeat(100);
    expect(slugify(longText).length).toBeLessThanOrEqual(50);
  });
});

describe("createProfileSlug", () => {
  it("should create slug with twitterId and username", () => {
    expect(createProfileSlug("12345", "kimito")).toBe("12345-kimito");
  });

  it("should return only twitterId when username is empty", () => {
    expect(createProfileSlug("12345", "")).toBe("12345");
    expect(createProfileSlug("12345")).toBe("12345");
  });

  it("should handle Japanese usernames", () => {
    expect(createProfileSlug("12345", "君斗りんく")).toBe("12345-君斗りんく");
  });
});

describe("createEventSlug", () => {
  it("should create slug with challengeId and title", () => {
    expect(createEventSlug(42, "Birthday Party")).toBe("42-birthday-party");
  });

  it("should return only challengeId when title is empty", () => {
    expect(createEventSlug(42, "")).toBe("42");
    expect(createEventSlug(42)).toBe("42");
  });

  it("should handle Japanese titles", () => {
    expect(createEventSlug(42, "生誕祭2024")).toBe("42-生誕祭2024");
  });

  it("should handle string challengeId", () => {
    expect(createEventSlug("42", "Test")).toBe("42-test");
  });
});

describe("extractIdFromSlug", () => {
  it("should extract numeric ID from slug", () => {
    expect(extractIdFromSlug("12345-kimito")).toBe("12345");
  });

  it("should handle slug without suffix", () => {
    expect(extractIdFromSlug("12345")).toBe("12345");
  });

  it("should handle complex slugs", () => {
    expect(extractIdFromSlug("42-birthday-party-2024")).toBe("42");
  });

  it("should return original if no numeric prefix", () => {
    expect(extractIdFromSlug("kimito")).toBe("kimito");
  });
});

describe("getCanonicalProfileUrl", () => {
  it("should generate canonical profile URL", () => {
    expect(getCanonicalProfileUrl("12345", "kimito")).toBe("/u/12345-kimito");
  });

  it("should handle missing username", () => {
    expect(getCanonicalProfileUrl("12345")).toBe("/u/12345");
  });
});

describe("getCanonicalEventUrl", () => {
  it("should generate canonical event URL", () => {
    expect(getCanonicalEventUrl(42, "Birthday Party")).toBe("/e/42-birthday-party");
  });

  it("should handle missing title", () => {
    expect(getCanonicalEventUrl(42)).toBe("/e/42");
  });
});

describe("isCanonicalUrl", () => {
  it("should return true for matching URLs", () => {
    expect(isCanonicalUrl("/u/12345-kimito", "/u/12345-kimito")).toBe(true);
  });

  it("should return false for non-matching URLs", () => {
    expect(isCanonicalUrl("/u/12345", "/u/12345-kimito")).toBe(false);
  });

  it("should handle URL-encoded characters", () => {
    expect(isCanonicalUrl("/u/12345-%E5%90%9B%E6%96%97", "/u/12345-君斗")).toBe(true);
  });
});
