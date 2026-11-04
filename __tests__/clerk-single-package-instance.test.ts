/**
 * 画面コードが @clerk/react / @clerk/shared を直接 import しないことを守る。
 *
 * ★2026-11-04 に必要になった理由（iOS build 549 の Guideline 2.1(a) 却下）:
 * components/providers/clerk-auth-bridge.tsx が `@clerk/react/legacy` から useSignIn を
 * import していた。Metro は ESM の import に "import" 条件を使うので
 * dist/legacy.mjs（ESM 版）が選ばれる。一方 @clerk/expo は CJS で
 * `require("@clerk/react")` するので dist/index.js（CJS 版）が入る。
 * 実際に iOS バンドルを書き出すと、両方の版と @clerk/shared の ESM/CJS 両方が載っていた。
 *
 * 2つの版は React context を共有しない。ESM 版の useSignIn は ClerkProvider を
 * 見つけられず起動直後に例外を投げ、ErrorBoundary の「エラーが発生しました」が出る。
 * 審査は "The app showed an error upon launch" と書いてきた。
 *
 * 型もテストも lint も素通りする（型は同じ）ので、import 経路をテストで固定する。
 * 旧 API が要るときは @clerk/expo/legacy を使う（CJS で require するので同じ版になる）。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, extname, relative } from "node:path";

const ROOT = resolve(__dirname, "..");
const CLIENT_DIRS = ["app", "components", "hooks", "lib", "features", "modules", "shared"];

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if ([".ts", ".tsx"].includes(extname(name))) {
      acc.push(full);
    }
  }
  return acc;
}

const DIRECT_IMPORT = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']@clerk\/(?:react|shared)(?:\/[^"']*)?["']/;

describe("Clerk は @clerk/expo 経由の1つの版だけを使う", () => {
  it("画面コードに @clerk/react / @clerk/shared の直接 import が無い", () => {
    const offenders = CLIENT_DIRS.flatMap((d) => walk(join(ROOT, d)))
      .filter((file) => DIRECT_IMPORT.test(readFileSync(file, "utf8")))
      .map((file) => relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it("clerk-auth-bridge の useSignIn は @clerk/expo/legacy から来る", () => {
    const src = readFileSync(join(ROOT, "components/providers/clerk-auth-bridge.tsx"), "utf8");
    expect(src).toMatch(/import\s*\{\s*useSignIn\s*\}\s*from\s*["']@clerk\/expo\/legacy["']/);
  });
});
