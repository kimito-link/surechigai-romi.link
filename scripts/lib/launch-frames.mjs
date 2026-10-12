/**
 * scripts/lib/launch-frames.mjs
 * 起動の画面録画（フレームの並び）から「アイコンが飛んでいないか／消えていないか」を判定する純粋関数。
 * 依存ゼロ・副作用なし。実機が無くても、合成フレームで単体テストできる（__tests__/launch-frames.test.ts）。
 *
 * ■ なぜ要るか（2026-10-12 Android 実機の起動録画）
 *   起動は「OS の起動画面（アイコン）→ ブートベール（アイコン＋タイトル）→ 待機画面 → ヒーロー」と繋がる。
 *   ここでアイコンの大きさ・位置が変わったり、1コマ消えたりすると「ちかちか」に見える。
 *   目視では何ミリ秒か分からず、直したかどうかも判定できないので、フレームごとにアイコンの外接矩形を測る。
 *
 * ■ 何を測るか（フレームごと）
 *   icon:    濃紺（#00427B 付近）の「つながった最大の塊」の幅％と縦の中心％。無ければ null。
 *            ★画面の上 10%（ステータスバー）と下 12%（ナビゲーションバー）は見ない。
 *            ★タイトル文字・スピナーは小さく独立した塊なので除かれる。
 *   heroBar: 幅の 85% 以上に渡る濃紺の帯＝ヒーローの CTA ボタン（「1タップではじめる」）。
 *
 * ■ 判定（analyzeLaunch）
 *   基準 = 最初にアイコンが出たフレーム群（OS の起動画面）の中央値。
 *   ヒーローが出るまでの間、
 *     ・アイコンが基準から幅/中心がズレた → 「飛び」（赤）
 *     ・アイコンが消えた                 → 「欠け」（連続した長さが maxGapMs を超えたら赤、以下なら注意）
 *   ★起動画面が一度も出ない／ヒーローまで届かない場合は「測れなかった」（inconclusive）。
 *     ★「測れなかった」を合格に数えない（偽の緑を作らない）。
 *
 * ■ 限界（この判定がしないこと）
 *   ・色の好み・大きさの好みは判定しない（OS の起動画面との「一致」だけ見る）
 *   ・ヒーロー以降は見ない
 *   ・濃紺のアイコンを前提にしている（アイコンの絵柄・色を変えたら閾値を見直すこと）
 */

/** 濃紺（#00427B 付近）か。録画の圧縮ノイズを許す範囲。 */
export function isNavy(r, g, b) {
  return r < 40 && g > 40 && g < 90 && b > 100 && b < 150;
}

/**
 * 1フレーム（RGB の生バイト列）を要約する。
 *
 * ★方式: 濃紺の画素を「つながった塊（連結成分）」に分け、最大の塊の外接矩形を見る。
 *   アイコンは濃紺の縁がぐるりと繋がった1つの大きな塊で、タイトル文字・スピナー・ボタンの文字は
 *   小さく独立した塊になるので混ざらない。
 *   ★「行ごとの濃紺の数」で塊を探す旧方式は、絵の細部が違うと（顔まわりの行で濃紺が減ると）塊が途中で割れて、
 *     下半分だけを拾って「飛んだ」と誤判定した（2026-10-12 実機録画で確認）。
 *
 * @param {{ data: Uint8Array|Buffer, width: number, height: number }} frame rgb24
 * @returns {{ icon: null | { wPct: number, cyPct: number, hPct: number }, heroBar: boolean }}
 */
export function summarizeFrame({ data, width, height }) {
  const top = Math.floor(height * 0.1);
  const bottom = Math.floor(height * 0.88);
  const rowsN = bottom - top;
  const size = width * rowsN;

  const mask = new Uint8Array(size);
  for (let y = 0; y < rowsN; y++) {
    const base = (top + y) * width * 3;
    for (let x = 0; x < width; x++) {
      const i = base + x * 3;
      if (isNavy(data[i], data[i + 1], data[i + 2])) mask[y * width + x] = 1;
    }
  }

  // 連結成分（4近傍）。最大面積の塊の外接矩形を取る。
  const seen = new Uint8Array(size);
  const stack = new Int32Array(size);
  let best = null;
  for (let p = 0; p < size; p++) {
    if (!mask[p] || seen[p]) continue;
    let sp = 0;
    stack[sp++] = p;
    seen[p] = 1;
    let area = 0;
    let minX = width;
    let maxX = -1;
    let minY = rowsN;
    let maxY = -1;
    while (sp > 0) {
      const q = stack[--sp];
      area++;
      const x = q % width;
      const y = (q - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && mask[q - 1] && !seen[q - 1]) { seen[q - 1] = 1; stack[sp++] = q - 1; }
      if (x < width - 1 && mask[q + 1] && !seen[q + 1]) { seen[q + 1] = 1; stack[sp++] = q + 1; }
      if (y > 0 && mask[q - width] && !seen[q - width]) { seen[q - width] = 1; stack[sp++] = q - width; }
      if (y < rowsN - 1 && mask[q + width] && !seen[q + width]) { seen[q + width] = 1; stack[sp++] = q + width; }
    }
    if (!best || area > best.area) best = { area, minX, maxX, minY, maxY };
  }

  // 小さな塊（文字・スピナー・ノイズ）は無視
  if (!best || best.area < width * height * 0.015) return { icon: null, heroBar: false };

  const blockW = best.maxX - best.minX + 1;
  const blockH = best.maxY - best.minY + 1;
  const wPct = (blockW / width) * 100;
  const hPct = (blockH / height) * 100;

  // ヒーローの帯: 幅が広い（85%以上）で、高さは低い（アイコンのような正方形ではない）
  if (wPct >= 85 && hPct < wPct * 0.6) return { icon: null, heroBar: true };

  // アイコン: 縦にある程度の高さがある塊（画面の 8% 未満は文字など）
  if (hPct < 8) return { icon: null, heroBar: false };

  const cy = top + (best.minY + best.maxY) / 2;
  return { icon: { wPct, cyPct: (cy / height) * 100, hPct }, heroBar: false };
}

function median(nums) {
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export const DEFAULT_THRESHOLDS = Object.freeze({
  /** アイコン幅の許容差（画面幅に対する％ポイント） */
  tolWidthPct: 3,
  /** アイコン縦中心の許容差（画面高に対する％ポイント） */
  tolCenterPct: 3,
  /** アイコンが消えたままの許容時間（ms）。これを超えたら赤。以下は「注意」。 */
  maxGapMs: 100,
  /** 基準（OS の起動画面）にするフレーム数 */
  referenceFrames: 5,
});

/**
 * フレームの要約の並び（時刻つき）から、起動の連続性を判定する。
 * @param {Array<{ t: number, icon: null|{wPct:number,cyPct:number}, heroBar: boolean }>} frames t は秒
 * @param {{ tolWidthPct?: number, tolCenterPct?: number, maxGapMs?: number, referenceFrames?: number }} [opts]
 * @returns {{
 *   verdict: "pass"|"fail"|"inconclusive",
 *   reasons: string[], warnings: string[],
 *   stats: { reference: null|{wPct:number,cyPct:number}, jumps: number, gapMaxMs: number, gapCount: number, heroAtSec: null|number, splashAtSec: null|number },
 * }}
 */
export function analyzeLaunch(frames, opts = {}) {
  const th = { ...DEFAULT_THRESHOLDS, ...opts };
  const reasons = [];
  const warnings = [];
  const stats = { reference: null, jumps: 0, gapMaxMs: 0, gapCount: 0, heroAtSec: null, splashAtSec: null };

  const firstIcon = frames.findIndex((f) => f.icon);
  if (firstIcon < 0) {
    return { verdict: "inconclusive", reasons: ["起動画面のアイコンが1コマも見つからない（録画が空、または起動できていない）"], warnings, stats };
  }
  stats.splashAtSec = frames[firstIcon].t;

  const heroIdx = frames.findIndex((f, i) => i > firstIcon && f.heroBar);
  if (heroIdx < 0) {
    return { verdict: "inconclusive", reasons: ["ヒーロー（1タップではじめるの帯）まで届かなかった（録画が短い／読み込みが終わっていない）"], warnings, stats };
  }
  stats.heroAtSec = frames[heroIdx].t;

  // 基準 = 最初のアイコン群（OS の起動画面）の中央値
  const refFrames = frames.slice(firstIcon).filter((f) => f.icon).slice(0, th.referenceFrames);
  const ref = {
    wPct: median(refFrames.map((f) => f.icon.wPct)),
    cyPct: median(refFrames.map((f) => f.icon.cyPct)),
  };
  stats.reference = ref;

  // 起動画面からヒーローの直前まで
  let gapStart = null;
  let gapMs = 0;
  let gapCount = 0;
  for (let i = firstIcon; i < heroIdx; i++) {
    const f = frames[i];
    if (f.icon) {
      if (gapStart !== null) {
        const ms = (f.t - gapStart) * 1000;
        gapCount++;
        gapMs = Math.max(gapMs, ms);
        gapStart = null;
      }
      const dw = Math.abs(f.icon.wPct - ref.wPct);
      const dc = Math.abs(f.icon.cyPct - ref.cyPct);
      if (dw > th.tolWidthPct || dc > th.tolCenterPct) {
        stats.jumps++;
        if (stats.jumps <= 3) {
          reasons.push(
            `アイコンが飛んだ（${f.t.toFixed(2)}s）: 幅 ${f.icon.wPct.toFixed(1)}%（基準 ${ref.wPct.toFixed(1)}%）／縦中心 ${f.icon.cyPct.toFixed(1)}%（基準 ${ref.cyPct.toFixed(1)}%）`,
          );
        }
      }
    } else if (gapStart === null) {
      gapStart = frames[i].t;
    }
  }
  if (gapStart !== null) {
    // ヒーローの直前までアイコンが無かった
    const ms = (frames[heroIdx].t - gapStart) * 1000;
    gapCount++;
    gapMs = Math.max(gapMs, ms);
  }
  stats.gapCount = gapCount;
  stats.gapMaxMs = Math.round(gapMs);

  if (gapCount > 0) {
    const msg = `アイコンが消えたコマがある（${gapCount}回・最長 ${Math.round(gapMs)}ms）`;
    if (gapMs > th.maxGapMs) reasons.push(`${msg} — 許容 ${th.maxGapMs}ms を超えている`);
    else warnings.push(`${msg} — 許容 ${th.maxGapMs}ms 以内（注意）`);
  }

  return { verdict: reasons.length ? "fail" : "pass", reasons, warnings, stats };
}
