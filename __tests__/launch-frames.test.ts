/**
 * 起動の画面録画の判定（scripts/lib/launch-frames.mjs）の単体テスト。実機・ffmpeg なしで、合成フレームで検証する。
 *
 * 守りたい失敗:
 *   1. 本物の不具合（アイコンの飛び・消えた）を「合格」と言ってしまう（偽の緑）
 *   2. 正常な起動を「赤」と言ってしまう（偽の赤）— 2026-10-12 に実際に踏んだ:
 *      「行ごとの濃紺の数」で塊を探す旧方式は、顔まわりの行で濃紺が減ると塊が割れて下半分だけを拾い、
 *      正常なベールを「飛んだ」と誤判定した。→ 連結成分に変えた。その回帰を「縁だけの輪（中が明るい）」で固定する。
 *   3. 測れていないのに合格と言う（録画が空／ヒーローまで届かない）
 */
import { describe, it, expect } from "vitest";
import { summarizeFrame, analyzeLaunch } from "../scripts/lib/launch-frames.mjs";

const W = 100;
const H = 200;
const BG: [number, number, number] = [226, 237, 247]; // #E2EDF7
const NAVY: [number, number, number] = [0, 66, 123]; // #00427B

/** 合成フレーム: 地色に、濃紺の矩形（塗り or 輪）を描く */
function frame(
  shapes: Array<{ x0: number; y0: number; x1: number; y1: number; ring?: number }>,
): { data: Uint8Array; width: number; height: number } {
  const data = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) data.set(BG, i * 3);
  for (const s of shapes) {
    for (let y = s.y0; y < s.y1; y++) {
      for (let x = s.x0; x < s.x1; x++) {
        if (s.ring) {
          const inner = x >= s.x0 + s.ring && x < s.x1 - s.ring && y >= s.y0 + s.ring && y < s.y1 - s.ring;
          if (inner) continue; // 中は地色のまま（顔の部分）
        }
        data.set(NAVY, (y * W + x) * 3);
      }
    }
  }
  return { data, width: W, height: H };
}

/** 幅 w%・縦中心 c% の正方形のアイコン（画面は 100x200 なので高さは幅の半分の「行数」を使う） */
function icon(wPct: number, cyPct: number, ring = 0) {
  const w = Math.round((wPct / 100) * W);
  const h = w; // 正方形（ピクセル）
  const x0 = Math.round((W - w) / 2);
  const cy = Math.round((cyPct / 100) * H);
  const y0 = cy - Math.round(h / 2);
  return { x0, y0, x1: x0 + w, y1: y0 + h, ring: ring || undefined };
}
const HERO = { x0: 4, y0: 120, x1: 96, y1: 134 }; // 幅92%・低い帯

describe("summarizeFrame", () => {
  it("アイコン（幅55%・縦中心50%）を測れる", () => {
    const s = summarizeFrame(frame([icon(55, 50)]));
    expect(s.heroBar).toBe(false);
    expect(s.icon).not.toBeNull();
    expect(Math.abs(s.icon!.wPct - 55)).toBeLessThan(2);
    expect(Math.abs(s.icon!.cyPct - 50)).toBeLessThan(2);
  });

  it("★縁だけの輪（中が明るい＝顔の部分）でも1つの塊として全体を測る（旧方式の偽の赤の回帰）", () => {
    const s = summarizeFrame(frame([icon(55, 50, 6)]));
    expect(s.icon).not.toBeNull();
    expect(Math.abs(s.icon!.wPct - 55)).toBeLessThan(2);
    expect(Math.abs(s.icon!.cyPct - 50)).toBeLessThan(2);
  });

  it("タイトル文字やスピナーのような小さな塊は、アイコンの測定に混ざらない", () => {
    const withText = summarizeFrame(
      frame([icon(55, 50), { x0: 35, y0: 158, x1: 65, y1: 162 }, { x0: 47, y0: 170, x1: 53, y1: 176 }]),
    );
    const plain = summarizeFrame(frame([icon(55, 50)]));
    expect(withText.icon!.cyPct).toBeCloseTo(plain.icon!.cyPct, 1);
    expect(withText.icon!.wPct).toBeCloseTo(plain.icon!.wPct, 1);
  });

  it("ヒーローの帯（幅が広く低い）を、アイコンでなく heroBar として検出する", () => {
    const s = summarizeFrame(frame([HERO]));
    expect(s.heroBar).toBe(true);
    expect(s.icon).toBeNull();
  });

  it("★ヒーローの帯が X の黒（#0F1419）でも heroBar として検出する（ボタンの色を変えて検査が測れなくなった事故の回帰）", () => {
    // 2026-10-12 に CTA を紺から X の黒へ変えたところ、帯が濃紺前提の検出が「ヒーローまで届かなかった」となり、
    // 実機の検査が5回すべて『測れなかった』になった。
    const d = frame([]);
    const INK: [number, number, number] = [15, 20, 25];
    for (let y = HERO.y0; y < HERO.y1; y++) for (let x = HERO.x0; x < HERO.x1; x++) d.data.set(INK, (y * W + x) * 3);
    const s = summarizeFrame(d);
    expect(s.heroBar).toBe(true);
    expect(s.icon).toBeNull();
  });

  it("X の黒の小さなボタン（ヘッダーのピル）は heroBar でもアイコンでもない", () => {
    const d = frame([]);
    const INK: [number, number, number] = [15, 20, 25];
    for (let y = 22; y < 38; y++) for (let x = 70; x < 96; x++) d.data.set(INK, (y * W + x) * 3);
    expect(summarizeFrame(d)).toEqual({ icon: null, heroBar: false });
  });

  it("濃紺が無い画面（ホーム画面など）は icon も heroBar もなし", () => {
    const s = summarizeFrame(frame([]));
    expect(s).toEqual({ icon: null, heroBar: false });
  });
});

/** 時刻つきの要約フレームを作る */
const F = (t: number, icon: null | { wPct: number; cyPct: number }, heroBar = false) => ({ t, icon, heroBar });
const OS = { wPct: 55.4, cyPct: 49.9 };

/** 起動の並び: ホーム → OS の起動画面 → ベール → ヒーロー */
function launch(veil: null | { wPct: number; cyPct: number }, opts: { gapMs?: number } = {}) {
  const frames = [F(0, null)];
  let t = 1.7;
  for (let i = 0; i < 5; i++) frames.push(F((t += 0.05), OS));
  if (opts.gapMs) {
    frames.push(F((t += 0.05), null)); // 消えたコマ
    t += opts.gapMs / 1000 - 0.05;
  }
  for (let i = 0; i < 5; i++) frames.push(F((t += 0.05), veil));
  frames.push(F((t += 0.05), null, true));
  return frames;
}

describe("analyzeLaunch", () => {
  it("OS の起動画面とベールのアイコンが一致していれば合格", () => {
    const r = analyzeLaunch(launch({ wPct: 54.8, cyPct: 49.9 }));
    expect(r.verdict).toBe("pass");
    expect(r.reasons).toEqual([]);
    expect(r.stats.heroAtSec).not.toBeNull();
  });

  it("★修正前の実測（ベールの幅43.7%・縦中心約45%）は『飛んだ』で赤にする", () => {
    const r = analyzeLaunch(launch({ wPct: 43.7, cyPct: 44.9 }));
    expect(r.verdict).toBe("fail");
    expect(r.stats.jumps).toBeGreaterThan(0);
    expect(r.reasons[0]).toContain("アイコンが飛んだ");
  });

  it("幅だけ・縦中心だけのズレも赤にする", () => {
    expect(analyzeLaunch(launch({ wPct: 44, cyPct: 49.9 })).verdict).toBe("fail");
    expect(analyzeLaunch(launch({ wPct: 55, cyPct: 45 })).verdict).toBe("fail");
  });

  it("許容差の内側（±3 ポイント）のずれは合格", () => {
    expect(analyzeLaunch(launch({ wPct: 53, cyPct: 51.5 })).verdict).toBe("pass");
  });

  it("アイコンが消えたコマが許容時間を超えたら赤（300ms）", () => {
    const r = analyzeLaunch(launch(OS, { gapMs: 300 }));
    expect(r.verdict).toBe("fail");
    expect(r.stats.gapMaxMs).toBeGreaterThan(100);
  });

  it("消えた時間が許容以内（約50ms）なら合格だが『注意』を残す（偽の緑にしない）", () => {
    const r = analyzeLaunch(launch(OS, { gapMs: 50 }));
    expect(r.verdict).toBe("pass");
    expect(r.warnings.length).toBe(1);
    expect(r.stats.gapCount).toBe(1);
  });

  it("許容時間は引数で変えられる", () => {
    expect(analyzeLaunch(launch(OS, { gapMs: 50 }), { maxGapMs: 20 }).verdict).toBe("fail");
  });

  it("★起動画面のアイコンが1コマも無ければ『測れなかった』（合格にしない）", () => {
    const r = analyzeLaunch([F(0, null), F(1, null), F(2, null, true)]);
    expect(r.verdict).toBe("inconclusive");
  });

  it("★ヒーローまで届かなければ『測れなかった』（合格にしない）", () => {
    const frames = launch({ wPct: 54.8, cyPct: 49.9 }).filter((f) => !f.heroBar);
    expect(analyzeLaunch(frames).verdict).toBe("inconclusive");
  });

  it("空の録画は『測れなかった』", () => {
    expect(analyzeLaunch([]).verdict).toBe("inconclusive");
  });
});
