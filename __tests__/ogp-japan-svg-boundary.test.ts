/**
 * OGP夜景の日本地図から「沖縄の囲み罫」を落とす処理を守る。
 *
 * 背景（2026-08-21 本番のOGP画像を目視して発覚）:
 *   夜景背景の左上に、**白い線が2本宙に浮いて**見えていた。
 *   正体は public/lp/img/japan.svg の `class="boundary-line"` の <line> 2本。
 *   日本地図で沖縄を左下の枠に描くときの区切り線で、
 *   LPの明るい地では自然だが、色が **#EEEEEE 固定**なので
 *   夜景（濃紺 #050B18〜）の上では浮いて見える。
 *
 * ★SVG本体は LP と共用なので元ファイルは変えず、OGPに取り込むときだけ透明にする。
 *   このテストは「置換が実際に効くか」を実ファイルで確かめる。
 *   SVGの構造が変わると**静かに置換が効かなくなり、また線が出る**ため。
 *
 * ★この不具合は curl -I が 200 / image/png を返すので配信確認では気づけない。
 *   画像を落として目視するまで分からない類（2026-08-19 の丸ピン未表示と同じ型）。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SVG_PATH = resolve(__dirname, "../public/lp/img/japan.svg");

/** api/og.tsx の loadJapanSvg と同じ置換。 */
function stripBoundaryLines(svg: string): string {
  return svg.replace(
    /(<g[^>]*class="boundary-line"[^>]*)stroke="#EEEEEE"/,
    '$1stroke="transparent"',
  );
}

describe("夜景の日本地図から囲み罫を落とす", () => {
  it("元のSVGには boundary-line が存在する（前提の固定）", () => {
    // これが無くなったら置換も不要になる。前提が変わったことに気づけるようにする。
    const svg = readFileSync(SVG_PATH, "utf8");

    expect(svg).toMatch(/class="boundary-line"/);
    expect(svg).toMatch(/<line\b/);
  });

  it("置換すると boundary-line の stroke が transparent になる", () => {
    const out = stripBoundaryLines(readFileSync(SVG_PATH, "utf8"));
    const g = out.match(/<g[^>]*class="boundary-line"[^>]*>/)?.[0] ?? "";

    expect(g).toContain('stroke="transparent"');
    expect(g).not.toContain("#EEEEEE");
  });

  it("置換は実際に何かを変えている（無言で素通りしない）", () => {
    // 正規表現が SVG の書き方とズレると、置換されないまま緑になる。
    // それを防ぐため「変化したこと」自体を検証する。
    const svg = readFileSync(SVG_PATH, "utf8");

    expect(stripBoundaryLines(svg)).not.toBe(svg);
  });

  it("地図本体（県のパス）は壊さない", () => {
    const svg = readFileSync(SVG_PATH, "utf8");
    const out = stripBoundaryLines(svg);

    // path の数が変わっていないこと＝形は無傷
    // （このSVGは県ごとではなく地方ごとにまとめられており実測17個。
    //   数そのものより「置換で減っていない」ことが要点）
    const count = (s: string) => (s.match(/<path\b/g) ?? []).length;
    expect(count(out)).toBe(count(svg));
    expect(count(out)).toBeGreaterThan(10);
  });
});
