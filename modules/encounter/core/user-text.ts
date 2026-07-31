/**
 * modules/encounter/core/user-text.ts
 *
 * ユーザーが自由入力したテキストの正規化と、モデレーション対象文の組み立て。
 *
 * 元は modules/encounter/api/visit.ts:31-34 の cleanText。
 * 場所メモ機能でも同じ処理が要るため core に移して共用する
 * （コピーを増やすと片方だけ直す事故になる）。
 */

/**
 * NFKC 正規化して trim し、空文字は null にする。
 * 全角スペースだけの入力や、見た目が同じでコードポイントが違う文字を揃える。
 */
export function cleanUserText(input: string | undefined | null): string | null {
  const text = input?.normalize("NFKC").trim();
  return text ? text : null;
}

/**
 * 複数の自由入力欄をまとめて1本のモデレーション対象文にする。
 *
 * 欄ごとに moderateText を呼ぶと LLM の往復が欄の数だけ増えるので連結して1回にする
 * （Groq/Gemini は無料枠が日次で決まっており、最悪10秒の往復が直列で乗るため）。
 * 全欄が空なら null を返す。呼び出し側は null のときモデレーションを丸ごと省略できる。
 */
export function buildModerationTarget(
  ...fields: (string | null | undefined)[]
): string | null {
  const parts = fields
    .map((f) => cleanUserText(f))
    .filter((f): f is string => f !== null);
  return parts.length > 0 ? parts.join(" ") : null;
}
