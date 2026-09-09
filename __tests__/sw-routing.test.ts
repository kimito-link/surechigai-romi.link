import { describe, it, expect } from "vitest";
import {
  isJsBundlePath,
  buildSwCacheVersion,
  isHtmlResponseForScript,
  SW_OFFLINE_SCRIPT_BODY,
  SW_OFFLINE_SCRIPT_CONTENT_TYPE,
} from "@/lib/pwa/sw-routing";

describe("isJsBundlePath", () => {
  it("Expo web バンドル", () => {
    expect(isJsBundlePath("/_expo/static/js/web/entry-abc.js")).toBe(true);
  });

  it("ルート JS", () => {
    expect(isJsBundlePath("/sw.js")).toBe(true);
  });

  it("HTML/CSS は false", () => {
    expect(isJsBundlePath("/index.html")).toBe(false);
    expect(isJsBundlePath("/global.css")).toBe(false);
  });
});

describe("buildSwCacheVersion", () => {
  it("commitSha から安定したキャッシュ名", () => {
    expect(buildSwCacheVersion("837cddbabc")).toMatch(/^v3-837cddbabc$/);
  });
});

describe("isHtmlResponseForScript", () => {
  // ★2026-09-06 の実機不具合の再現条件。
  //   存在しないチャンクにサーバーが index.html を 200 で返していた。
  it("JSを頼んでHTMLが返ったら true", () => {
    expect(
      isHtmlResponseForScript(
        "/_expo/static/js/web/sign-in-abc.js",
        "text/html; charset=utf-8",
      ),
    ).toBe(true);
  });

  it("正常なJS応答は false", () => {
    expect(
      isHtmlResponseForScript(
        "/_expo/static/js/web/sign-in-abc.js",
        "application/javascript",
      ),
    ).toBe(false);
  });

  it("そもそもJSでないパスは false（HTMLページは普通にHTMLでよい）", () => {
    expect(isHtmlResponseForScript("/index.html", "text/html")).toBe(false);
    expect(isHtmlResponseForScript("/map", "text/html")).toBe(false);
  });

  it("Content-Type が無いときは掴まない", () => {
    expect(isHtmlResponseForScript("/_expo/static/js/web/a.js", null)).toBe(
      false,
    );
  });
});

describe("オフライン時のJSフォールバック", () => {
  // ★JSONを返すとJSとして構文エラーになり、チャンク落ち検知にも繋がらない。
  it("Content-Type は JS であって JSON ではない", () => {
    expect(SW_OFFLINE_SCRIPT_CONTENT_TYPE).toContain("javascript");
    expect(SW_OFFLINE_SCRIPT_CONTENT_TYPE).not.toContain("json");
  });

  it("本文は JS として構文エラーにならない", () => {
    expect(() => new Function(SW_OFFLINE_SCRIPT_BODY)).not.toThrow();
  });
});
