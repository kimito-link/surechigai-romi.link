/**
 * modules/event/core/prefectures.ts
 *
 * 47都道府県の固定リストとバリデーション（純TS）。
 * 会議の合意「prefecture は固定リストから選ばせ、サーバ側でも enum バリデーション
 * （自由入力させない＝位置詐称防止）」を実装。
 *
 * event モジュールを自己完結させ doin-challenge.com にもそのまま移植できるよう、
 * encounter モジュールの逆ジオコーディングには依存せずここで持つ。
 */

export const PREFECTURES = [
  "北海道",
  "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県",
  "沖縄県",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

const PREFECTURE_SET: ReadonlySet<string> = new Set(PREFECTURES);

/** 47都道府県のいずれかか。 */
export function isValidPrefecture(value: string | null | undefined): value is Prefecture {
  return value != null && PREFECTURE_SET.has(value);
}
