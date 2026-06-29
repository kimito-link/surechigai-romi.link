/**
 * kimito.link / surechigai 連携 URL の単体テスト。
 * 都道府県クリエイター一覧の主リンクが kimito.link になることを保証する。
 */

import { describe, it, expect } from "vitest";
import {
  buildKimitoPublicProfileUrl,
  buildSurechigaiShareUrl,
  formatKimitoLinkLabel,
} from "../lib/kimito-link-urls.js";

describe("buildKimitoPublicProfileUrl", () => {
  it("@ 付き username から kimito.link 公開 URL を組み立てる", () => {
    expect(buildKimitoPublicProfileUrl("@streamerfunch")).toBe(
      "https://kimito.link/streamerfunch/",
    );
  });

  it("前後空白を除去する", () => {
    expect(buildKimitoPublicProfileUrl("  streamerfunch  ")).toBe(
      "https://kimito.link/streamerfunch/",
    );
  });

  it("特殊文字は encodeURIComponent する", () => {
    expect(buildKimitoPublicProfileUrl("user/name")).toBe(
      "https://kimito.link/user%2Fname/",
    );
  });

  it("X (twitter.com) URL にはならない", () => {
    const url = buildKimitoPublicProfileUrl("streamerfunch");
    expect(url).toMatch(/^https:\/\/kimito\.link\//);
    expect(url).not.toContain("x.com");
    expect(url).not.toContain("twitter.com");
  });
});

describe("buildSurechigaiShareUrl", () => {
  it("shareSlug から surechigai 共有地図 URL を組み立てる", () => {
    expect(buildSurechigaiShareUrl("abc123xyz")).toBe(
      "https://surechigai.kimito.link/u/abc123xyz",
    );
  });

  it("kimito.link ドメインにはならない", () => {
    const url = buildSurechigaiShareUrl("slug");
    expect(url).toContain("surechigai.kimito.link");
    expect(url).not.toMatch(/^https:\/\/kimito\.link\//);
  });
});

describe("formatKimitoLinkLabel", () => {
  it("表示用ラベルは kimito.link/username/ 形式", () => {
    expect(formatKimitoLinkLabel("@streamerfunch")).toBe("kimito.link/streamerfunch/");
  });
});
