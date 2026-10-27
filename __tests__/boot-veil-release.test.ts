// ブートベールの解除（lib/boot-veil.ts）の契約テスト。
// 経緯: ルートのレイアウトのマウントで外すと、タブの画面が読み込み中の空白が露出した。
// 解除は2フレーム待ってから1回だけフェードする。すぐに属性を消すと絵が飛ぶ。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isBootVeilReleasedByLandingScreen,
  releaseBootVeil,
  resetBootVeilStateForTests,
} from "../lib/boot-veil";

const ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

afterEach(() => {
  resetBootVeilStateForTests();
  delete (globalThis as Record<string, unknown>).document;
  delete (globalThis as Record<string, unknown>).requestAnimationFrame;
  delete (globalThis as Record<string, unknown>).matchMedia;
});

function stubDocument() {
  const attrs = new Map<string, string>([["data-auth-boot", "1"]]);
  const el = {
    setAttribute: (k: string, v: string) => attrs.set(k, v),
    removeAttribute: (k: string) => attrs.delete(k),
    getAttribute: (k: string) => attrs.get(k) ?? null,
  };
  (globalThis as Record<string, unknown>).document = { documentElement: el };
  return attrs;
}

describe("isBootVeilReleasedByLandingScreen", () => {
  it("タブと公開プロフィールは画面自身が外す", () => {
    for (const p of ["/", "", "/index", "/?auto=x", "//", "/checkin", "/zukan", "/map", "/mypage", "/u", "/u/abc"]) {
      expect(isBootVeilReleasedByLandingScreen(p)).toBe(true);
    }
  });
  it("それ以外の画面は、ルートのレイアウトが外す", () => {
    for (const p of ["/sign-in", "/events", "/terms", null, undefined]) {
      expect(isBootVeilReleasedByLandingScreen(p as string)).toBe(false);
    }
  });
});

describe("releaseBootVeil", () => {
  it("2フレーム待ってからフェードを始め、時間後に属性を消す", () => {
    const attrs = stubDocument();
    const queue: Array<() => void> = [];
    (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: () => void) => void queue.push(cb);
    let pending: (() => void) | null = null;
    const orig = globalThis.setTimeout;
    globalThis.setTimeout = ((cb: () => void) => {
      pending = cb;
      return 0;
    }) as typeof setTimeout;
    try {
      releaseBootVeil();
      expect(attrs.get("data-auth-boot")).toBe("1");
      expect(attrs.has("data-boot-leave")).toBe(false);
      queue.shift()!();
      expect(attrs.has("data-boot-leave")).toBe(false);
      queue.shift()!();
      expect(attrs.get("data-boot-leave")).toBe("1");
      expect(attrs.get("data-auth-boot")).toBe("1");
      pending!();
      expect(attrs.has("data-auth-boot")).toBe(false);
      expect(attrs.has("data-boot-leave")).toBe(false);
    } finally {
      globalThis.setTimeout = orig;
    }
  });

  it("requestAnimationFrame が無い環境でも、フェードのあとで外す", () => {
    const attrs = stubDocument();
    let pending: (() => void) | null = null;
    const orig = globalThis.setTimeout;
    globalThis.setTimeout = ((cb: () => void) => {
      pending = cb;
      return 0;
    }) as typeof setTimeout;
    try {
      releaseBootVeil();
      expect(attrs.get("data-boot-leave")).toBe("1");
      expect(attrs.get("data-auth-boot")).toBe("1");
      pending!();
      expect(attrs.has("data-auth-boot")).toBe(false);
    } finally {
      globalThis.setTimeout = orig;
    }
  });

  it("prefers-reduced-motion では待たずに外す", () => {
    const attrs = stubDocument();
    (globalThis as Record<string, unknown>).matchMedia = () => ({ matches: true });
    releaseBootVeil();
    expect(attrs.has("data-auth-boot")).toBe(false);
    expect(attrs.has("data-boot-leave")).toBe(false);
  });

  it("document が無い環境（ネイティブ）では落ちない", () => {
    expect(() => releaseBootVeil()).not.toThrow();
  });
});

describe("呼び出し箇所", () => {
  it("トップ画面（/）が自分で外す", () => {
    const src = read("app/(tabs)/index.tsx");
    expect(src).toMatch(/useReleaseBootWhen\(showGuestScreen\)/);
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*releaseBootVeil\(\);\s*\}, \[\]\)/);
  });

  it("ルートのレイアウトは、画面自身が外すパスでは外さない", () => {
    const src = read("app/_layout.tsx");
    expect(src).toMatch(/if \(!isBootVeilReleasedByLandingScreen\(pathname\)\) releaseBootVeil\(\)/);
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*releaseBootVeil\(\);\s*\}, \[\]\)/);
    expect(src).not.toMatch(/function releaseBootVeil/);
  });
});
