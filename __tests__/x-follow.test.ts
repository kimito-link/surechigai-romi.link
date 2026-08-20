/**
 * フォロー導線の URL 生成を守る。
 *
 * 移植元(kimitolink-linktree)では「X でフォロー」というラベルなのに
 * リンク先がプロフィールURLで、ラベルの約束と遷移先が食い違っていた。
 * ここでは intent/follow を出すこと、壊れた値を弾くことを固定する。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildXFollowUrl } from "@/lib/x-follow";

describe("buildXFollowUrl", () => {
  it("フォロー確認画面のURLを作る", () => {
    expect(buildXFollowUrl("idolfunch")).toBe(
      "https://x.com/intent/follow?screen_name=idolfunch",
    );
  });

  it("@ が付いていても外す", () => {
    expect(buildXFollowUrl("@idolfunch")).toBe(
      "https://x.com/intent/follow?screen_name=idolfunch",
    );
  });

  it("x.com を使う（twitter.com だと1ホップ増える）", () => {
    expect(buildXFollowUrl("a")).toContain("https://x.com/");
    expect(buildXFollowUrl("a")).not.toContain("twitter.com");
  });

  it("表示名など screen_name でない値は null", () => {
    // これを通すと必ず404になる（実際に踏んだ事故）
    expect(buildXFollowUrl("君斗りんく@動員ちゃれんじ")).toBeNull();
    expect(buildXFollowUrl("has space")).toBeNull();
    expect(buildXFollowUrl("a".repeat(16))).toBeNull();
  });

  it("空・null は null", () => {
    expect(buildXFollowUrl("")).toBeNull();
    expect(buildXFollowUrl(null)).toBeNull();
    expect(buildXFollowUrl(undefined)).toBeNull();
  });
});

describe("封筒のフォロー導線", () => {
  const SRC = readFileSync(
    resolve(__dirname, "../components/post/encounter-open-modal.tsx"),
    "utf8",
  );

  it("フォローボタンがある", () => {
    expect(SRC).toContain("buildXFollowUrl");
    expect(SRC).toContain("X でフォローする");
  });

  it("押下領域が 44px 以上（Apple HIG）", () => {
    const m = SRC.match(/modalFollowButton:\s*\{[\s\S]*?\}/);
    expect(m, "modalFollowButton が無い").not.toBeNull();
    const h = m![0].match(/minHeight:\s*(\d+)/);
    expect(h, "minHeight が無い").not.toBeNull();
    expect(Number(h![1])).toBeGreaterThanOrEqual(44);
  });

  it("「押すだけでフォローされる」と書かない（自動フォローではない）", () => {
    expect(SRC).not.toMatch(/押すだけで.*フォロー/);
    expect(SRC).not.toMatch(/自動でフォロー/);
  });
});
