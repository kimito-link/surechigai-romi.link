/**
 * 日本地図（都道府県ブロック）のレイアウト計算。
 *
 * 描画（japan-block-map.tsx）から切り離した純関数。
 * この計算は2度ユーザー報告の事故を起こしているため、テストで固定する。
 *
 * 経緯:
 * 1. 2026-07-31: 素直に画面幅を14分割すると、スマホでセルが23〜25px・フォント8pxまで潰れ、
 *    「北海道」が「北海」に切れて読めなかった。
 * 2. 2026-08-01: 下限44pxを入れて、割り込む幅では横スクロールに逃がすようにした。
 *    しかし 14列×44px = 655px が 375px の画面にそのまま描画され、
 *    ScrollView 自身が内容幅まで広がって scrollWidth === clientWidth となり
 *    **スクロールも効かないまま左右が見切れた**（親に overflow:hidden があるため到達不能）。
 * 3. 現在: 横スクロールという逃げ道自体をやめ、必ず収まるセルサイズを採用する。
 *    読みやすさは「狭い画面ほど すき間と外側パディングを詰める」ことと
 *    「2文字表記＋2文字前提のフォントサイズ」で確保する。
 *
 * ★ここに固定の下限セルサイズを再導入しないこと。入れた瞬間に 2. の見切れが再発する。
 */

/** このサイズ以上ならフルネーム(最大3文字)を表示。未満は2文字表記。 */
export const FULL_NAME_MIN_CELL_SIZE = 42;

/** 地図の列数（JAPAN_GRID の各行の長さと一致させること） */
export const JAPAN_MAP_COLS = 14;

/** 画面幅に応じた すき間 / 外側パディング。狭いほど詰めてセルを大きく保つ。 */
export function spacingFor(width: number): { gap: number; outerPadding: number } {
  if (width < 430) return { gap: 1, outerPadding: 12 };
  if (width < 640) return { gap: 2, outerPadding: 16 };
  return { gap: 3, outerPadding: 24 };
}

export type MapLayout = {
  cellSize: number;
  mapWidth: number;
  fontSize: number;
  gap: number;
  /** 何文字まで表示できるか。1 なら「北」だけ、2 なら「北海」、3 なら「北海道」 */
  maxChars: 1 | 2 | 3;
  /** 利用可能幅に収まっているか。false になったら見切れ事故の再来 */
  fitsWithin: boolean;
};

/** 読める最小フォント。これを割るくらいなら文字数を減らす */
const MIN_FONT = 9;

/**
 * 与えられた幅で地図をどう描くかを決める。
 *
 * @param availableWidth 地図を置ける幅。
 *   ウィンドウ幅を渡す場合は左右の余白ぶんを引く必要があるため outerPadding を差し引く。
 *   実測したコンテナ幅を渡す場合は既に余白が除かれているので `alreadyInset` を true にする。
 */
export function computeMapLayout(
  availableWidth: number,
  maxMapWidth = 760,
  alreadyInset = false,
): MapLayout {
  const cols = JAPAN_MAP_COLS;
  // NaN / 0 / 負値でも壊れないよう最小幅に丸める
  const usable = Number.isFinite(availableWidth) ? availableWidth : 0;
  const safeWidth = Math.max(usable || 320, 320);
  const { gap, outerPadding } = spacingFor(safeWidth);
  const avail = Math.min(safeWidth - (alreadyInset ? 0 : outerPadding), maxMapWidth);
  const cellSize = Math.max(1, Math.floor((avail - gap * (cols - 1)) / cols));
  const mapWidth = cellSize * cols + gap * (cols - 1);
  // 日本語は全角＝1文字が font-size とほぼ同じ幅を占める。
  // セルには padding(1px×2) と border(1px×2) があるので、文字に使えるのは cellSize-4。
  //
  // ★ここを 1px でも欲張ると text-overflow:ellipsis が発動し、
  //   「北海」が「北…」になって県名が読めなくなる（2026-08-01 のスクショで発覚）。
  //   ライブのブラウザでは出ず、3x スケールの撮影で初めて見えた。
  //   文字を削るのは許容するが、省略記号だけは出さない。
  const INNER = cellSize - 4;

  // 収まる文字数を「大きい方から」試す。MIN_FONT を割るなら文字数を減らす。
  let maxChars: 1 | 2 | 3 = 1;
  if (cellSize >= FULL_NAME_MIN_CELL_SIZE && Math.floor(INNER / 3) >= MIN_FONT) maxChars = 3;
  else if (Math.floor(INNER / 2) >= MIN_FONT) maxChars = 2;

  const fontSize = Math.max(
    MIN_FONT,
    Math.min(Math.floor(INNER / maxChars), Math.round(cellSize * (maxChars === 3 ? 0.34 : 0.46))),
  );
  return { cellSize, mapWidth, fontSize, gap, maxChars, fitsWithin: mapWidth <= avail };
}
