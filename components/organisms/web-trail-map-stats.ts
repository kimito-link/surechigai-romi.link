/**
 * 地図タブの統計カード（すれ違った人 / 図鑑 / 市区町村）の対話可否判定。
 *
 * なぜ .tsx から分けるか:
 * このリポジトリのテストは environment:"node" で JSX を解釈しないため、
 * コンポーネントから import すると vitest がパースに失敗する。
 * 判定ロジックだけを .ts に置けばユニットテストで守れる
 * （japan-block-map.tsx に対する japan-block-map-layout.ts と同じ流儀）。
 */

/**
 * 統計カードを押せる状態にしてよいか。
 *
 * - ハンドラ未指定なら押せない:
 *   この部品は自分の地図タブと公開ページ /u/<slug> の両方で使われる。
 *   他人のページで押せると閲覧者本人の図鑑へ飛んで文脈が壊れるため、
 *   着地ページ側は onStatsPress を渡さないことで非対話に保つ（opt-in）。
 * - isLoading 中は押せない:
 *   値が「—」の間は、押した数字が指す先が定まらない。
 */
export function isStatCardInteractive(
  handler: (() => void) | undefined,
  isLoading: boolean,
): boolean {
  return Boolean(handler) && !isLoading;
}
