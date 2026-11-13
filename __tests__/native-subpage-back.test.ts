/**
 * ネイティブのタブ外画面に戻るボタンがあるか（2026-11-13 総点検）。
 * ScreenContainer はネイティブでヘッダーを描かず、Stack も headerShown:false なので、
 * 画面名を渡さないと戻る手段が画面端スワイプだけになる。
 * あわせて、Web のタブアイコン対応表がネイティブ側と揃っているか（さがすタブが「!」になっていた）。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(__dirname, "..", rel), "utf8");

describe("ネイティブのタブ外画面の戻るボタン", () => {
  it("ScreenContainer がネイティブで戻る帯を出す", () => {
    const src = read("components/organisms/screen-container.tsx");
    expect(src).toContain("<NativeSubpageBar");
    expect(src).toMatch(/Platform\.OS !== "web" && !withChrome && !inTabs/);
  });

  it.each([
    ["app/premium.tsx"],
    ["app/special-thanks.tsx"],
    ["components/photo-import/photo-import-screen.tsx"],
  ])("%s は画面名を渡している", (file) => {
    const src = read(file);
    const containers = src.match(/<ScreenContainer[^>]*>/g) ?? [];
    expect(containers.length).toBeGreaterThan(0);
    for (const tag of containers) expect(tag).toContain("nativeTitle=");
  });

  it("訪問申告は headerProps.title で帯が出る", () => {
    expect(read("components/visit/visit-screen-view.tsx")).toMatch(/title: "訪問申告"/);
  });
});

describe("タブアイコンの対応表", () => {
  const keys = (src: string) => {
    const body = src.slice(src.indexOf("MAPPING"), src.indexOf("};", src.indexOf("MAPPING")));
    return new Set(
      [...body.matchAll(/^\s*"?([a-z][a-z.]*)"?\s*:/gm)].map((m) => m[1]),
    );
  };
  it("Web 版がネイティブ版の名前をすべて持つ", () => {
    const native = keys(read("components/atoms/icon-symbol.tsx"));
    const web = keys(read("components/atoms/icon-symbol.web.tsx"));
    const missing = [...native].filter((k) => !web.has(k));
    expect(missing).toEqual([]);
    expect(web.has("globe.asia.australia.fill")).toBe(true);
  });
});
