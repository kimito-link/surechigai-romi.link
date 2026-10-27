/**
 * 起動画面の絵（data URI）の回帰テスト。
 *
 * 外部ファイルの取得を待つと、最初の描画に絵が間に合わず地色だけになる。
 * HTML に data URI を埋め、+html.tsx 以外のバンドルには入れない。
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { BOOT } from "../theme/tokens/boot";
import { BOOT_SPLASH_DATA_URI, BOOT_SPLASH_SOURCE_SHA256 } from "../theme/tokens/boot-splash-data";

const ROOT = resolve(__dirname, "..");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");
const PNG_PATH = resolve(ROOT, "public/boot-splash.png");

/** 全訪問の HTML に入る。これを超えると通常訪問が重くなる。 */
const MAX_URI_KB = 80;

describe("起動画面の埋め込み画像", () => {
  it("public/boot-splash.png がある", () => {
    expect(() => statSync(PNG_PATH)).not.toThrow();
  });

  it("data URI は PNG で、予算内（80KB 以下）", () => {
    expect(BOOT_SPLASH_DATA_URI.startsWith("data:image/png;base64,")).toBe(true);
    expect(BOOT_SPLASH_DATA_URI.length / 1024).toBeLessThanOrEqual(MAX_URI_KB);
  });

  it("埋め込みは public/boot-splash.png と同期している", () => {
    const sha = createHash("sha256").update(readFileSync(PNG_PATH)).digest("hex");
    expect(BOOT_SPLASH_SOURCE_SHA256).toBe(sha);
  });

  it("ベールは data URI を背景に持ち、外部 URL を背景にしない", () => {
    expect(HTML_SRC).toContain('background-image: url("${BOOT_SPLASH_DATA_URI}")');
    expect(HTML_SRC).not.toContain('background-image: url("${BOOT.splashSrc}")');
    expect(HTML_SRC).not.toContain('background-image: url("${BOOT.markSrc}")');
    expect(BOOT.splashSrc).toBe("/boot-splash.png");
  });

  it("boot-splash-data を import してよいのは app/+html.tsx だけ", () => {
    const offenders: string[] = [];
    const skip = new Set(["node_modules", ".git", ".expo", "dist", ".vercel", "apps", "line-bot", ".claude", "scripts", "__tests__"]);
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (skip.has(name)) continue;
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) {
          const rel = p.slice(ROOT.length + 1).replace(/\\/g, "/");
          if (rel === "theme/tokens/boot-splash-data.ts") continue;
          if (readFileSync(p, "utf8").includes("boot-splash-data")) offenders.push(rel);
        }
      }
    };
    walk(ROOT);
    expect(offenders).toEqual(["app/+html.tsx"]);
  });

  it("巨大な元画像をベールの src/href にしていない", () => {
    expect(HTML_SRC).not.toMatch(/(?:src|href)="\/lp\/img\/chara\/link\.png"/);
  });

  it("絵は画面中央で、幅は BOOT.artWidth", () => {
    expect(HTML_SRC).toContain("width: ${BOOT.artWidth}");
    expect(HTML_SRC).toContain("align-items: center");
    expect(HTML_SRC).toContain("justify-content: center");
    expect(BOOT.artWidth).toContain("78vw");
  });
});
