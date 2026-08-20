/**
 * lib/live-camera/live-stream-pick.ts
 *
 * YouTube の検索結果から「この場所の配信」として出してよい1本を選ぶ。
 *
 * ★なぜ画面から切り離すのか（2026-08-16 の教訓）:
 *   「どの場所を見せるか」を JSX の中に書いていたせいで、壊れても型もテストも
 *   通ってしまい「足あと0件で機能ごと消える」に長く気づけなかった
 *   （resolve-place-context.ts と同じ理由）。ここも判断は純粋関数に出して、
 *   条件をテストで固定する。API を叩かずに選び方だけを検証できる。
 *
 * ★なぜ絞り込みが要るか:
 *   「茅野市 ライブカメラ」の検索1位が、その場所の配信とは限らない。
 *   絞らないと**まったく関係ない場所の映像へ直行させてしまう**。
 *   検索結果ページ方式なら利用者が見て選べたが、直行させる以上こちらで責任を持つ。
 *   確信が持てないものは採用せず、従来どおり検索ページへ落とす方が良い。
 */

/** YouTube search API から必要な分だけ取り出した形 */
export type LiveCandidate = {
  videoId: string;
  title: string;
  channelTitle: string;
};

export type PickedLiveStream = LiveCandidate & { url: string };

/**
 * 市区町村名から検索・照合に使う「核」を取り出す。
 *
 * 「茅野市」→「茅野」。配信タイトルは「諏訪湖(茅野)ライブ」のように
 * 接尾辞を落として書かれることが多く、「茅野市」で完全一致を求めると
 * ほぼ全て弾かれてしまう。
 *
 * ★2文字未満になる場合は削らない（例:「市川市」から「市川」は正しいが、
 *   短すぎる核は誤一致を生むため、そのまま使う）。
 */
export function placeCore(place: string): string {
  const trimmed = place.trim();
  // 都道府県・市区町村・郡の接尾辞を1つだけ落とす
  const stripped = trimmed.replace(/(都|道|府|県|市|区|町|村|郡)$/u, "");
  return stripped.length >= 2 ? stripped : trimmed;
}

/**
 * 配信タイトル（＋チャンネル名）に地名が入っているかで採否を決める。
 *
 * チャンネル名も見るのは、「【LIVE】諏訪湖」のようにタイトルが短く、
 * 地名がチャンネル側にある配信を落とさないため。
 */
export function matchesPlace(candidate: LiveCandidate, place: string): boolean {
  const core = placeCore(place);
  if (!core) return false;

  const haystack = `${candidate.title} ${candidate.channelTitle}`;
  return haystack.includes(core);
}

/**
 * 候補から1本選ぶ。地名が確認できるものだけを返し、無ければ null。
 *
 * null は「配信が無い」ではなく「**自信を持って出せるものが無い**」の意味。
 * 呼び出し側は従来どおり検索結果ページへ落とす（体験が今より悪くならない）。
 */
export function pickLiveStream(
  candidates: LiveCandidate[],
  place: string,
): PickedLiveStream | null {
  const hit = candidates.find((c) => c.videoId && matchesPlace(c, place));
  if (!hit) return null;

  return { ...hit, url: `https://www.youtube.com/watch?v=${hit.videoId}` };
}
