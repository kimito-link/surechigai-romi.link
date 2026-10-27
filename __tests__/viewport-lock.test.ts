/**
 * 横スワイプで画面がずれないようにする。ピンチと文字の拡大は禁止しない。
 * iOS Safari / Android Chrome が対象。地図のピンチは MapLibre 側。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROOT_VIEWPORT_CONTENT, viewportAllowsUserZoom } from "@/shared/web-viewport";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("横ずれは止めて、ピンチと文字の拡大は残す", () => {
  it("viewport は device-width / initial-scale=1 / viewport-fit=cover で、拡大は禁止しない", () => {
    expect(viewportAllowsUserZoom(ROOT_VIEWPORT_CONTENT)).toBe(true);
    expect(ROOT_VIEWPORT_CONTENT).toBe("width=device-width, initial-scale=1, viewport-fit=cover");
    expect(ROOT_VIEWPORT_CONTENT).not.toContain("shrink-to-fit");
    expect(ROOT_VIEWPORT_CONTENT).not.toMatch(/maximum-scale|minimum-scale|user-scalable/);
    const html = read("app/+html.tsx");
    expect(html).toContain("ROOT_VIEWPORT_CONTENT");
    expect(html).toContain("overflow-x: hidden");
    expect(html).toContain("overflow-x: clip");
    expect(html).toContain("max-width: 100%");
    expect(html).toContain("touch-action: pan-y pinch-zoom");
    expect(html).not.toContain("100vw");
    expect(html).not.toMatch(/maximum-scale|user-scalable\s*=\s*no/);
  });

  it("html/body の max-width は 100vw ではない（はみ出しの原因）", () => {
    const css = code("global.css");
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).not.toMatch(/max-width:\s*100vw/);
    expect(css).toMatch(/overflow-x:\s*hidden/);
    expect(css).toMatch(/overflow-x:\s*clip/);
    expect(css).toMatch(/touch-action:\s*pan-y pinch-zoom\s*;/);
  });

  it("アプリの根は横にはみ出さない。WebView の拡大禁止は置かない", () => {
    const pkg = read("package.json");
    expect(pkg).not.toContain("react-native-webview");
    const layout = read("app/_layout.tsx");
    expect(layout).toContain('overflow: "hidden"');
    expect(layout).toContain('maxWidth: "100%"');
  });
});
