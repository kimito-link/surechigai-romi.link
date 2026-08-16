/**
 * lib/place-context/resolve-place-context.ts
 *
 * 「いまの様子」バー（天気・ライブカメラ）で **どの場所を見せるか** を決める。
 *
 * ★2026-08-16 にここを切り出した理由:
 * この判断を JSX の中に書いていたため、壊れても型もテストも通ってしまい、
 * 「足あとが0件だと機能ごと画面から消える」状態に長く気づけなかった。
 * 画面から切り離した純粋関数にして、条件をテストで固定する。
 *
 * 方針: **データが無いと機能が消える、を作らない。**
 * 自分の足あとが無い人には「いま人がいる県」を見せる。始めたばかりでも中身が見え、
 * そこへ行く動機にもなる。ただし誰の場所なのかは必ず明示する（自分の現在地と誤解させない）。
 */

export type PlaceContext = {
  /** 実際に天気・ライブカメラを引く県。null なら何も出さない。 */
  prefecture: string | null;
  /** 市区町村。フォールバック時は引き継がない（他人の県に自分の市名を混ぜない）。 */
  municipality: string | null;
  /** 自分の足あとではなく「いま人がいる県」を見せているか（断り書きの出し分けに使う）。 */
  isFallback: boolean;
};

export function resolvePlaceContext(input: {
  /** 自分の最新の足あとの県 */
  prefecture?: string | null;
  /** 自分の最新の足あとの市区町村 */
  municipality?: string | null;
  /** 足あとが無いときに代わりに見せる県（例: いま一番人がいる県） */
  fallbackPrefecture?: string | null;
}): PlaceContext {
  const own = normalize(input.prefecture);

  if (own) {
    return {
      prefecture: own,
      municipality: normalize(input.municipality),
      isFallback: false,
    };
  }

  const fallback = normalize(input.fallbackPrefecture);
  if (fallback) {
    return {
      prefecture: fallback,
      // 自分の市区町村は持ち込まない（他人の県に自分の市名が付くと嘘になる）
      municipality: null,
      isFallback: true,
    };
  }

  return { prefecture: null, municipality: null, isFallback: false };
}

/** 空文字・空白だけの値は「無い」として扱う（DB由来の "" で誤動作させない）。 */
function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
