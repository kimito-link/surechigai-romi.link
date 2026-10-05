/**
 * 起動画像（apple-touch-startup-image）は「中身のハッシュ入りの名前」で配る、という契約テスト。
 *
 * 背景（2026-10-05）:
 *   固定ファイル名＋`immutable` キャッシュは、このリポで実害が出た型（docs/symptoms.md SG-02）。
 *   クエリ `?v=` はその場しのぎで、CDN・ブラウザ・iOS がクエリをどう扱うかに依存する。
 *   そこで画像のファイル名を中身の sha256 先頭12桁入りにし、`?v=` を廃止した。
 *
 * 守るもの（`pnpm splash:sync` の出力が壊れたら赤になる）:
 *   (a) app/+html.tsx の全 apple-touch-startup-image の href にクエリが無い
 *   (b) href のファイル名に12桁の16進ハッシュが入っている
 *   (c) 参照先が public/splash/ に実在し、中身の sha256 先頭がファイル名のハッシュと一致する
 *   (d) public/splash/ に、どの href からも参照されない画像（旧名・旧ハッシュ）が残っていない
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");
const SPLASH_DIR = resolve(ROOT, "public/splash");

const HASHED = /^\/splash\/(ios-(?:\d+x\d+|fallback))\.([0-9a-f]{12})\.png$/;

/** link タグ単位で href を取り出す（JSX の自己閉じタグ・複数行に対応） */
function startupImageHrefs(): string[] {
  const tags = HTML_SRC.match(/<link\b[^>]*?rel="apple-touch-startup-image"[^>]*?\/>/g) ?? [];
  return tags
    .map((t) => t.match(/href="([^"]+)"/)?.[1])
    .filter((h): h is string => typeof h === "string");
}

describe("起動画像は内容ハッシュ名で配る", () => {
  const hrefs = startupImageHrefs();

  it("href を十分な数（機種表＋fallback）拾えている", () => {
    // 23 解像度 + fallback。拾えていなければ正規表現が壊れており、以降の検査が空振りする。
    expect(hrefs.length).toBeGreaterThanOrEqual(19);
  });

  it("(a) どの href にもクエリ（?v= など）が無い", () => {
    expect(hrefs.filter((h) => h.includes("?"))).toEqual([]);
  });

  it("(b) どの href も ios-<w>x<h>.<12桁の16進>.png 形式", () => {
    expect(hrefs.filter((h) => !HASHED.test(h))).toEqual([]);
  });

  it("(c) 参照先が実在し、中身の sha256 先頭12桁がファイル名と一致する", () => {
    const problems: string[] = [];
    for (const href of hrefs) {
      const m = href.match(HASHED);
      if (!m) continue; // (b) で報告済み
      const file = resolve(SPLASH_DIR, `${m[1]}.${m[2]}.png`);
      if (!existsSync(file)) {
        problems.push(`${href}: 画像が無い`);
        continue;
      }
      const actual = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12);
      if (actual !== m[2]) problems.push(`${href}: 中身のハッシュは ${actual}`);
    }
    expect(problems).toEqual([]);
  });

  it("(d) public/splash/ に、参照されない画像（旧名・旧ハッシュ）が残っていない", () => {
    const referenced = new Set(hrefs.map((h) => h.replace(/^\/splash\//, "")));
    const stray = readdirSync(SPLASH_DIR).filter((f) => f.endsWith(".png") && !referenced.has(f));
    expect(stray).toEqual([]);
  });
});
