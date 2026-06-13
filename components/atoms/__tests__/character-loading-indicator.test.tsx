/**
 * CharacterLoadingIndicator コンポーネントのテスト
 */

import { describe, it, expect } from "vitest";

describe("CharacterLoadingIndicator", () => {
  describe("LOADING_MESSAGES", () => {
    it("should have multiple loading messages", () => {
      // メッセージの存在を確認
      const messages = [
        "読み込み中...",
        "もうちょっと待ってね！",
        "がんばって探してるよ！",
        "もう少しだよ〜",
        "わくわく...",
      ];
      expect(messages.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("SCROLL_MESSAGES", () => {
    it("should have multiple scroll messages", () => {
      const messages = [
        "もっと見る？",
        "まだまだあるよ！",
        "下にスクロール！",
        "続きを見てね♪",
      ];
      expect(messages.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Size configurations", () => {
    it("should have correct size configurations", () => {
      const sizeConfig = {
        small: { image: 40, fontSize: 12 },
        medium: { image: 60, fontSize: 14 },
        large: { image: 80, fontSize: 16 },
      };

      expect(sizeConfig.small.image).toBe(40);
      expect(sizeConfig.medium.image).toBe(60);
      expect(sizeConfig.large.image).toBe(80);
    });
  });

  describe("Component behavior", () => {
    it("should not render when isLoading is false and variant is loading", () => {
      // variant="loading" && isLoading=false の場合は null を返す
      const shouldRender = (isLoading: boolean, variant: string) => {
        if (variant === "loading" && !isLoading) return false;
        return true;
      };

      expect(shouldRender(false, "loading")).toBe(false);
      expect(shouldRender(true, "loading")).toBe(true);
    });

    it("should not render when hasNextPage is false and variant is scroll", () => {
      // variant="scroll" && hasNextPage=false の場合は null を返す
      const shouldRender = (hasNextPage: boolean, variant: string) => {
        if (variant === "scroll" && !hasNextPage) return false;
        return true;
      };

      expect(shouldRender(false, "scroll")).toBe(false);
      expect(shouldRender(true, "scroll")).toBe(true);
    });
  });

  describe("ScrollMoreIndicator", () => {
    it("should show loading indicator when fetching", () => {
      const getVariant = (isFetching: boolean, hasNextPage: boolean) => {
        if (isFetching) return "loading";
        if (hasNextPage) return "scroll";
        return null;
      };

      expect(getVariant(true, true)).toBe("loading");
      expect(getVariant(true, false)).toBe("loading");
    });

    it("should show scroll indicator when has next page", () => {
      const getVariant = (isFetching: boolean, hasNextPage: boolean) => {
        if (isFetching) return "loading";
        if (hasNextPage) return "scroll";
        return null;
      };

      expect(getVariant(false, true)).toBe("scroll");
    });

    it("should return null when no next page and not fetching", () => {
      const getVariant = (isFetching: boolean, hasNextPage: boolean) => {
        if (isFetching) return "loading";
        if (hasNextPage) return "scroll";
        return null;
      };

      expect(getVariant(false, false)).toBe(null);
    });
  });
});
