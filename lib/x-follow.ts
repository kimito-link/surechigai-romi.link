/**
 * X の「フォロー確認画面」へ直行する Web Intent URL。
 *
 * kimitolink-linktree の lib/x-follow.ts を移植（2026-08-20）。
 *
 * 【なぜ要るか】
 * このアプリは「アプリ内はDM禁止・交流はXに委譲」という設計なので、
 * すれ違った相手と繋がる手段は X のフォローしかない。
 * プロフィールURL（https://x.com/<handle>）を開くだけだと、相手には
 *   1. プロフィールを開く → 2. 本人か確認する → 3. フォローボタンを探して押す
 * が残る。intent/follow はフォロー確認画面を直接開くので 1 と 3 が減る。
 *
 * ★これは「自動フォロー」ではない。最後は本人がフォローボタンを押す。
 *   UI 文言で「押すだけでフォローされる」等と書かないこと（規約・景表法）。
 *   未ログインの訪問者にはサインイン導線が出る（＝その場では完了しない人が居る前提）。
 *
 * ★ドメインは x.com に統一する（twitter.com ではない）。
 *   twitter.com/intent/follow は x.com へリダイレクトされるため、
 *   **工程を減らす目的なのに 1 ホップ増える**。
 */

/**
 * フォロー確認画面へ直行する URL を組み立てる。
 *
 * @param username X の screen_name（`@` は付いていても外す）
 * @returns intent URL。使えない値なら null（呼び出し側でボタンごと出し分ける）
 */
export function buildXFollowUrl(username: string | null | undefined): string | null {
  const handle = (username ?? "").trim().replace(/^@+/, "");
  if (!handle) return null;

  // screen_name は英数字とアンダースコアのみ・15文字以内。
  // 表示名（例: 君斗りんく@動員ちゃれんじ）を渡すと必ず 404 になるので弾く。
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;

  const params = new URLSearchParams({ screen_name: handle });
  return `https://x.com/intent/follow?${params.toString()}`;
}
