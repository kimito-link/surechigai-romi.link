/**
 * modules/encounter/core/account-deletion-confirm.ts
 *
 * アカウント削除の確認フレーズ。UI（入力欄）とサーバー（zod バリデーション）の
 * 両方から参照する単一の真実。ここがズレると、UIの指示どおりに入力しても
 * サーバーで弾かれる（あるいは確認なしで消せてしまう）ため定数化している。
 */
export const ACCOUNT_DELETION_CONFIRM_PHRASE = "削除する";
