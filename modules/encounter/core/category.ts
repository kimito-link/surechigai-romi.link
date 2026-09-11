/**
 * modules/encounter/core/category.ts
 *
 * ユーザーの「属性」を表す固定カテゴリ。
 *
 * ■ なぜ作るか（2026-09-07 オーナーの実体験から）
 *   オーナーがジモティで取引しようとして当日すっぽかされた。そのとき気づいたのが
 *   「★Xで普段のツイートが見えていれば、会う前に相手が分かって安心できた」ということ。
 *   ジモティは取引履歴と評価しか見えず、しかもアカウントを消せば連絡手段が絶たれる。
 *
 *   このアプリは「取引の場」を作らない（投稿も金銭も持たない）。
 *   代わりに「★属性が合う人を見つけて、Xへ送る」ところまでを担う。
 *   カテゴリはその「属性」を表す唯一のデータになる。
 *
 * ■ ★固定リストにする理由（自由入力にしない）
 *   1. 自由入力にした瞬間「投稿を持たない＝モデレーション不要」という最大の利点が消える
 *      （NGワード・通報・不適切表現の対応が芋づるで必要になる）
 *   2. 「属性が合う」は同一 id の一致で判定する。表記揺れ（"Vtuber"/"VTuber"/"ぶいちゅーばー"）
 *      は機能そのものを壊す
 *   3. オーナー自身が姉妹アプリで「ジャンルが広すぎて迷う」と結論している
 *
 * ■ ★「その他」を置かない理由
 *   「その他」同士が一致しても何の共通点も示さない。一致信号を持たない値は、
 *   あるだけで「属性が合う」の意味を薄める。選べないときは何も選ばないのが正しい。
 *
 * ■ 前方互換
 *   語彙を減らすときも DB の値は消さない。parseCategories が未知 id を捨てるので、
 *   古い値が残っていても表示されないだけで壊れない。
 */

/** 語彙の版。語彙を変えたら上げる（保存済みデータの解釈を変えるときの目印） */
export const CATEGORY_VOCAB_VERSION = 1;

/**
 * 固定カテゴリの id。★ASCII snake_case。最大12件まで。
 *
 * ★増やすときは「この属性が一致したら、会いに行きたくなるか」で判断する。
 *   一致しても嬉しくない粒度（例: "趣味"）は入れない。
 */
export const CATEGORY_IDS = [
  "yuzuriai",
  "oshi_katsu",
  "seichi",
  "haishin",
  "drive",
  "camp",
  "gourmet",
  "onsen",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/** 表示ラベル。★全 id に必ず存在すること（テストで守る） */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  yuzuriai: "ゆずり合い",
  oshi_katsu: "推し活",
  seichi: "聖地巡礼",
  haishin: "配信・VTuber",
  drive: "ドライブ",
  camp: "キャンプ",
  gourmet: "グルメ",
  onsen: "温泉・旅",
};

/** プロフィールに付けられるカテゴリの上限 */
export const MAX_PROFILE_CATEGORIES = 3;
/** 集まりに付けられるカテゴリの上限 */
export const MAX_EVENT_CATEGORIES = 3;

const CATEGORY_ID_SET: ReadonlySet<string> = new Set(CATEGORY_IDS);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && CATEGORY_ID_SET.has(value);
}

/**
 * DB のカンマ区切り文字列 → CategoryId[]。
 * ★未知の id は黙って捨てる（語彙を減らしても古いデータで壊れないため）。
 */
export function parseCategories(raw: string | null | undefined): CategoryId[] {
  if (!raw) return [];
  const out: CategoryId[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (isCategoryId(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * CategoryId[] → DB に入れるカンマ区切り文字列。
 * ★未知 id を捨て、重複を除き、max 件で切る（呼び出し側の検証漏れを吸収する）。
 */
export function serializeCategories(
  ids: readonly string[],
  max: number,
): string {
  const out: CategoryId[] = [];
  for (const id of ids) {
    if (out.length >= max) break;
    if (isCategoryId(id) && !out.includes(id)) out.push(id);
  }
  return out.join(",");
}

/**
 * 2人の共通カテゴリ。★「属性が合う」の判定はこれだけ。
 *
 * ★相性スコアのような数字は作らない。根拠を説明できない数字は信用を損なう
 *   （フォロワーが多い＝気が合う、ではない）。出すのは「何が一致したか」だけ。
 */
export function sharedCategories(
  a: readonly string[],
  b: readonly string[],
): CategoryId[] {
  const setB = new Set(b.filter(isCategoryId));
  const out: CategoryId[] = [];
  for (const id of a) {
    if (isCategoryId(id) && setB.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** 表示用ラベル。★未知 id は空文字（チップを描かない合図） */
export function categoryLabel(id: string): string {
  return isCategoryId(id) ? CATEGORY_LABELS[id] : "";
}
