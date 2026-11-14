/**
 * ★2026-11-14「動きがぎこちない」対策の再発防止。
 * - ネイティブ（.native.tsx）は lazy() を使わない: 初回 suspend で fallback が最低 300ms 出て、
 *   メニュー・封筒・タブの初回表示がもたつくため。
 * - Web 版と同じ名前を export する（どちらの版でも呼び出し側が同じに書ける）。
 * - タブの親はログイン前後で型を変えない（変えるとタブ全体が作り直しになる）。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const exportedNames = (src: string) =>
  [
    ...src.matchAll(/export\s+(?:const|function)\s+(\w+)/g),
    ...[...src.matchAll(/export\s*\{([^}]+)\}/g)].flatMap((m) =>
      m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!.replace(/^type\s+/, "")),
    ),
  ]
    .map((n) => (typeof n === "string" ? n : n[1]))
    .filter(Boolean)
    .sort();

const pairs = [
  ["lib/lazy-heavy-components.tsx", "lib/lazy-heavy-components.native.tsx"],
  ["components/tabs/authenticated-screen-slot.tsx", "components/tabs/authenticated-screen-slot.native.tsx"],
  ["components/post/radar-parts.tsx", "components/post/radar-parts.native.tsx"],
  ["components/tabs/tab-lazy-parts.tsx", "components/tabs/tab-lazy-parts.native.tsx"],
] as const;

describe("ネイティブは lazy の初回 suspend を挟まない", () => {
  for (const [web, native] of pairs) {
    it(`${native} は lazy() を使わず、${web} と同じ名前を export する`, () => {
      const n = read(native);
      expect(n).not.toMatch(/\blazy\(\s*\(\)/);
      expect(exportedNames(n)).toEqual(exportedNames(read(web)));
    });
  }

  it("タブの親はログイン前後で同じ（TutorialProvider を常に置く）", () => {
    const all = read("app/(tabs)/_layout.tsx");
    const src = all.slice(all.indexOf("export default function TabLayout"));
    expect(src).not.toMatch(/if\s*\(\s*!isAuthenticated\s*\)\s*\{?\s*return/);
    expect(src).toMatch(/<TutorialProvider>/);
  });
});
