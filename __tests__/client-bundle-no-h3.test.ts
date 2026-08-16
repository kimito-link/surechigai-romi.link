/**
 * クライアント（Web/ネイティブの画面コード）が h3-js を引き込まないことを守る。
 *
 * ★2026-08-16 に必要になった理由:
 * lib/navigation/open-maps-directions.ts が `assertFiniteLatLng` **1関数のために**
 * modules/encounter/core/geo.ts を import しており、geo.ts が h3-js を import して
 * いるせいで **h3-js 全体がWebバンドル(__common)に載っていた**。
 * ゲストのトップページは地理計算を一切しないのに起動時に読まされ、
 * 実測で __common が 2255KB → 2054KB（-201KB）になった。
 *
 * この種の肥大は型もテストも lint も素通りする（動作は正しいため）。
 * import 経路をテストで固定する。
 *
 * 座標の型と検証だけが要るときは modules/encounter/core/lat-lng.ts を使う。
 * セル計算など h3 が要るものだけ geo.ts を使う（= サーバー/API 側）。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";

const ROOT = resolve(__dirname, "..");

/** 画面側のコードが置かれるディレクトリ（ここから h3 を辿れてはいけない） */
const CLIENT_DIRS = ["app", "components", "hooks", "lib"];

/** h3-js を正当に使ってよいファイル（サーバー/API と、その計算本体） */
const ALLOWED = new Set([
  "modules/encounter/core/geo.ts",
  "lib/bootstrap/text-decoder-init.ts",
  "lib/polyfills/text-decoder-utf16.ts",
]);

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

function relative(file: string): string {
  return file.slice(ROOT.length + 1).replace(/\\/g, "/");
}

describe("クライアントバンドルの重量級依存", () => {
  it("画面側のコードが h3-js を直接 import していない", () => {
    const offenders: string[] = [];
    for (const dir of CLIENT_DIRS) {
      for (const file of walk(resolve(ROOT, dir))) {
        const rel = relative(file);
        if (ALLOWED.has(rel)) continue;
        const src = readFileSync(file, "utf8");
        if (/from\s+["']h3-js["']/.test(src)) offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("画面側のコードが geo.ts 経由で h3-js を引き込んでいない", () => {
    // geo.ts は h3-js を import するので、画面側から import すると全部載る。
    // 座標の検証だけなら lat-lng.ts を使うこと。
    const offenders: string[] = [];
    for (const dir of CLIENT_DIRS) {
      for (const file of walk(resolve(ROOT, dir))) {
        const rel = relative(file);
        if (ALLOWED.has(rel)) continue;
        const src = readFileSync(file, "utf8");
        if (/from\s+["'][^"']*encounter\/core\/geo(\.js)?["']/.test(src)) {
          offenders.push(rel);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("lat-lng.ts は依存ゼロを保っている（重い依存を持ち込まない）", () => {
    const src = readFileSync(resolve(ROOT, "modules/encounter/core/lat-lng.ts"), "utf8");
    // import 文が1つも無いこと（型だけの純粋モジュール）
    expect(src).not.toMatch(/^\s*import\s/m);
  });

  it("geo.ts は今も h3-js を使っている（この分離の前提が崩れたら見直す）", () => {
    const src = readFileSync(resolve(ROOT, "modules/encounter/core/geo.ts"), "utf8");
    expect(src).toMatch(/from\s+["']h3-js["']/);
  });
});
