/**
 * 横スワイプで画面が拡大し、横へずれるのを viewport と overflow で止める。
 * iOS Safari / Android Chrome、およびこの HTML を開く WebView が対象。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROOT_VIEWPORT_CONTENT, WEBVIEW_ZOOM_LOCK, viewportLocksHorizontalZoom } from "@/shared/web-viewport";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("横スワイプで拡大しない", () => {
  it("viewport は device-width / initial-scale=1 / maximum-scale=1", () => {
    expect(viewportLocksHorizontalZoom(ROOT_VIEWPORT_CONTENT)).toBe(true);
    expect(ROOT_VIEWPORT_CONTENT).not.toContain("shrink-to-fit");
    const html = read("app/+html.tsx");
    expect(html).toContain("ROOT_VIEWPORT_CONTENT");
    expect(html).toContain("overflow-x: hidden");
    expect(html).toContain("overflow-x: clip");
    expect(html).toContain("max-width: 100%");
    expect(html).not.toContain("100vw");
  });

  it("html/body の max-width は 100vw ではない（はみ出しの原因）", () => {
    const css = code("global.css");
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).not.toMatch(/max-width:\s*100vw/);
    expect(css).toMatch(/overflow-x:\s*hidden/);
    expect(css).toMatch(/overflow-x:\s*clip/);
    expect(css).toMatch(/touch-action:\s*pan-y\s*;/);
    expect(css).not.toContain("pinch-zoom");
  });

  it("WebView を使うなら拡大コントロールを切る。いまは使っていない", () => {
    expect(WEBVIEW_ZOOM_LOCK.scalesPageToFit).toBe(false);
    expect(WEBVIEW_ZOOM_LOCK.setBuiltInZoomControls).toBe(false);
    expect(WEBVIEW_ZOOM_LOCK.setDisplayZoomControls).toBe(false);
    const pkg = read("package.json");
    expect(pkg).not.toContain("react-native-webview");
    const layout = read("app/_layout.tsx");
    expect(layout).toContain('overflow: "hidden"');
    expect(layout).toContain('maxWidth: "100%"');
  });
});
