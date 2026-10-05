// manifest.background_color が、ベール・待機画面・本体の地色と同じ #E2EDF7 であることの契約テスト（ソース検査）。
// 経緯: 2026-08-27 に background_color を削除したが、その根拠（iOS が起動画像を無視する）は一次情報が無く、
//       2026-10-05 の実機録画でも説明できなかった。Android(WebAPK) は background_color から起動画面の地色を
//       作るので、無いと白になりベールとの間で色が飛ぶ。そこで #E2EDF7 を戻した。
//
// 2026-10-05 追記: manifest.theme_color（ステータスバー色）も同じ #E2EDF7 にそろえる契約を足した。
//       Android(WebAPK) の実機録画で、OS起動画面のステータスバーは manifest.theme_color（当時は紺 #00427B）、
//       Chrome の窓へ切り替わった一瞬は明色、ページの <meta name="theme-color"> が効くと再び紺、と
//       起動のたびに「紺→明→紺」の往復が見えていた。theme_color を地色と同じ明色にすれば
//       どの段階でも同じ色になり往復が消える。3者（manifest.theme_color / manifest.background_color /
//       meta theme-color）が同値であることをここで固定する。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { palette } from "../theme/tokens/palette";

const ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const BASE_BG = "#E2EDF7";

describe("manifest.background_color と地色の一致", () => {
  const manifest = JSON.parse(read("public/manifest.json")) as { background_color?: string };

  it("manifest の background_color が #E2EDF7（大文字小文字は無視）", () => {
    expect(typeof manifest.background_color).toBe("string");
    expect(manifest.background_color!.toUpperCase()).toBe(BASE_BG);
  });

  it("ブートベール（app/+html.tsx）の背景色と一致する", () => {
    const html = read("app/+html.tsx");
    expect(html).toMatch(/background-color:\s*#E2EDF7\s*!important/i);
  });

  it("BrandLoadingScreen は palette.kimitoBlueSoft を地色にしており、その値が #E2EDF7", () => {
    const src = read("components/atoms/brand-loading-screen.tsx");
    expect(src).toMatch(/BOOT_BACKGROUND\s*=\s*palette\.kimitoBlueSoft/);
    expect(palette.kimitoBlueSoft.toUpperCase()).toBe(BASE_BG);
  });
});

describe("manifest.theme_color（ステータスバー色）が地色と同じ", () => {
  const manifest = JSON.parse(read("public/manifest.json")) as {
    theme_color?: string;
    background_color?: string;
  };
  const html = read("app/+html.tsx");

  it("manifest の theme_color が background_color と同値（＝#E2EDF7）", () => {
    expect(typeof manifest.theme_color).toBe("string");
    expect(manifest.theme_color!.toUpperCase()).toBe(BASE_BG);
    expect(manifest.theme_color!.toUpperCase()).toBe(manifest.background_color!.toUpperCase());
  });

  it("app/+html.tsx の <meta name=\"theme-color\"> は palette.kimitoBlueSoft を参照し、その値が manifest.theme_color と同じ", () => {
    // 色の正本は theme/tokens/palette.ts（#RRGGBB を置く唯一の場所）。+html.tsx に生の #RRGGBB を書かない。
    const metaTags = html.match(/<meta\s+name="theme-color"[^>]*>/g) ?? [];
    expect(metaTags.length).toBe(1);
    expect(metaTags[0]).toMatch(/content=\{palette\.kimitoBlueSoft\}/);
    expect(html).toMatch(/import\s*\{\s*palette\s*\}\s*from\s*"@\/theme\/tokens\/palette"/);
    expect(palette.kimitoBlueSoft.toUpperCase()).toBe(manifest.theme_color!.toUpperCase());
  });

  it("地色が明色なので iOS standalone のステータスバーは default（黒文字）のまま。黒地前提の値にしない", () => {
    // black / black-translucent は白文字固定なので、明色地 #E2EDF7 の上では読めなくなる。
    const statusBarTags = [
      ...html.matchAll(/<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="([^"]+)"/g),
      ...read("components/brand/web-document-head.tsx").matchAll(
        /<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="([^"]+)"/g,
      ),
    ].map((m) => m[1]);
    expect(statusBarTags.length).toBeGreaterThan(0);
    for (const v of statusBarTags) expect(v).toBe("default");
  });
});
