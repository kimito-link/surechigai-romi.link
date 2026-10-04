// ブートベールの解除（lib/boot-veil.ts）の契約テスト。
// 経緯: ルートのレイアウトのマウントで外すと、タブの画面が読み込み中の空白が露出した
//       （ベール解除から本編まで、ゲストで約350ms / ヒントありで約570ms。本番を PWA 起動に見立てて測定）。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { isBootVeilReleasedByLandingScreen, releaseBootVeil } from "../lib/boot-veil";

const ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

afterEach(() => {
  delete (globalThis as Record<string, unknown>).document;
  delete (globalThis as Record<string, unknown>).requestAnimationFrame;
});

describe("isBootVeilReleasedByLandingScreen", () => {
  it("トップ（/）は画面自身が外す", () => {
    for (const p of ["/", "", "/index", "/?auto=x", "//"]) expect(isBootVeilReleasedByLandingScreen(p)).toBe(true);
  });
  it("それ以外の画面は、ルートのレイアウトが外す", () => {
    for (const p of ["/sign-in", "/events", "/u/abc", "/terms", null, undefined]) {
      expect(isBootVeilReleasedByLandingScreen(p as string)).toBe(false);
    }
  });
});

describe("releaseBootVeil", () => {
  const stubDocument = () => {
    const attrs = new Map<string, string>([["data-auth-boot", "1"]]);
    (globalThis as Record<string, unknown>).document = {
      documentElement: { removeAttribute: (k: string) => attrs.delete(k), getAttribute: (k: string) => attrs.get(k) ?? null },
    };
    return attrs;
  };

  it("2フレーム待ってから外す（1フレームでは足りない）", () => {
    const attrs = stubDocument();
    const queue: Array<() => void> = [];
    (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: () => void) => void queue.push(cb);
    releaseBootVeil();
    expect(attrs.has("data-auth-boot")).toBe(true);
    queue.shift()!(); // 1フレーム目
    expect(attrs.has("data-auth-boot")).toBe(true);
    queue.shift()!(); // 2フレーム目
    expect(attrs.has("data-auth-boot")).toBe(false);
  });

  it("requestAnimationFrame が無い環境では即座に外す", () => {
    const attrs = stubDocument();
    releaseBootVeil();
    expect(attrs.has("data-auth-boot")).toBe(false);
  });

  it("document が無い環境（ネイティブ）では何もしない・落ちない", () => {
    expect(() => releaseBootVeil()).not.toThrow();
  });
});

describe("呼び出し箇所", () => {
  it("トップ画面（/）が自分で外す", () => {
    const src = read("app/(tabs)/index.tsx");
    expect(src).toMatch(/import \{ releaseBootVeil \} from "@\/lib\/boot-veil"/);
    expect(src).toMatch(/useEffect\(\(\) => \{\s*releaseBootVeil\(\);\s*\}, \[\]\)/);
  });

  it("ルートのレイアウトは、トップ（/）では外さない（空白が露出するため）", () => {
    const src = read("app/_layout.tsx");
    expect(src).toMatch(/if \(!isBootVeilReleasedByLandingScreen\(pathname\)\) releaseBootVeil\(\)/);
    // 無条件に外す呼び出し（旧実装）に戻っていない
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*releaseBootVeil\(\);\s*\}, \[\]\)/);
    // 実装本体は lib に1つだけ
    expect(src).not.toMatch(/function releaseBootVeil/);
  });
});
