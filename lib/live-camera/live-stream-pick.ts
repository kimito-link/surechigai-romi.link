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

/**
 * その配信を「いまの様子」として出してよいか。
 *
 * ★2026-08-23 の実害:
 *   茅野市にいる人に **「【ライブ配信】長野市内の様子」** を出していた。
 *   ★直線距離で 73km。「いまの様子」と言える距離ではない。
 *
 *   仕組み上こうなる: 市区町村で見つからないと都道府県で引き直すため、
 *   「長野市」の配信が「長野県」の名前で一致してしまう。
 *   実測（長野県の3市）:
 *     伊那市 → 伊那谷ライブカメラ   [matched=伊那市]  ★近い
 *     茅野市 → 長野市内の様子       [matched=長野県]  ★73km先
 *     塩尻市 → JR長野駅ライブカメラ [matched=長野県]  ★別の市
 *
 * ★県フォールバック自体は残す（消すと「配信が無い」が増えて体験が痩せる）。
 *   ★嘘をつくのをやめるだけにする: 市区町村で当たったものだけ「いまの様子」を名乗り、
 *   県で当たったものは「県内の様子」と正直に見せる。
 *
 *   このプロダクトの価値は「正確な場所」なので、
 *   ★分からないものを分かったように見せる方が、出さないより害が大きい。
 *
 * @param matchedPlace API が実際に一致させた地名（市区町村 or 都道府県）
 * @param municipality 利用者が実際にいる市区町村
 */
export function isSameCityStream(
  matchedPlace: string | null | undefined,
  municipality: string | null | undefined,
): boolean {
  const m = String(matchedPlace ?? "").trim();
  const c = String(municipality ?? "").trim();
  if (!m || !c) return false;
  // ★核どうしで比べる（「茅野市」と「茅野」を同じと見なす）。
  return placeCore(m) === placeCore(c);
}

/**
 * 「いまの様子」ラベルの文言を決める。
 *
 * ★near/far を呼び出し側の if で書かない（画面に散ると必ず食い違う）。
 */
export function liveStreamProximityLabel(
  matchedPlace: string | null | undefined,
  municipality: string | null | undefined,
): "いまの様子" | "県内の様子" {
  return isSameCityStream(matchedPlace, municipality) ? "いまの様子" : "県内の様子";
}
