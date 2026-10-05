// manifest.background_color が、ベール・待機画面・本体の地色と同じ #E2EDF7 であることの契約テスト（ソース検査）。
// 経緯: 2026-08-27 に background_color を削除したが、その根拠（iOS が起動画像を無視する）は一次情報が無く、
//       2026-10-05 の実機録画でも説明できなかった。Android(WebAPK) は background_color から起動画面の地色を
//       作るので、無いと白になりベールとの間で色が飛ぶ。そこで #E2EDF7 を戻した。
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
