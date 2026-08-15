/**
 * 封筒レールの表示件数ロジック。
 *
 * なぜ .tsx から分けるか: テストは environment:"node" で JSX を解釈しないため。
 * （japan-block-map.tsx に対する japan-block-map-layout.ts と同じ流儀）
 */

/** 未展開時にレールへ並べる上限 */
export const ENVELOPE_RAIL_LIMIT = 5;

/**
 * レールに出す封筒と、隠れている件数を求める。
 *
 * 展開すると全件出す（遷移しない）。封筒の全件一覧ルートは存在せず、
 * 横スクロールなので全件出しても縦を圧迫しないため。
 */
export function visibleEnvelopes<T>(
  items: T[],
  expanded: boolean,
): { shown: T[]; hiddenCount: number } {
  if (expanded) return { shown: [...items], hiddenCount: 0 };
  const shown = items.slice(0, ENVELOPE_RAIL_LIMIT);
  return { shown, hiddenCount: items.length - shown.length };
}
