/**
 * modules/event/core/block-filter.ts
 *
 * イベント一覧からブロック関係の相手を除外する。
 *
 * ★なぜ必要か（2026-08-15 の調査で発見した穴）:
 *   modules/event/ 配下にブロックを見るコードが**1行も無かった**。
 *   すれ違い側(modules/encounter/db/queries.ts の getBlockSet)は除外しているのに、
 *   イベント側だけ素通しで、
 *     - ブロックした相手の集まりが一覧に出る
 *     - ブロックした相手が自分の集まりに参加表明できる
 *   状態だった。「友達を誘う」を足すとこの穴は悪化する（誘われたくない相手に
 *   誘いが届く）ので、招待機能より先に塞ぐ。
 *
 * ★相互に効く: ブロックは「した側」からも「された側」からも相手を隠す。
 *   どちらのIDを集めるかは呼び出し側（getBlockedUserIds）が担う。
 */

/**
 * 主催者がブロック関係にある集まりを取り除く。
 *
 * blockedUserIds が null のときは絞り込まない（未ログインの公開一覧など、
 * そもそも誰との関係も判定できない場合）。
 */
export function excludeBlockedCreators<T extends { creatorId: number }>(
  rows: T[],
  blockedUserIds: Set<number> | null,
): T[] {
  if (!blockedUserIds || blockedUserIds.size === 0) return [...rows];
  return rows.filter((row) => !blockedUserIds.has(row.creatorId));
}
