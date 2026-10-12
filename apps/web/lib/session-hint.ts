/**
 * Clerk の `__client_uat` cookie から「ログイン済みかも」を判定する純関数（依存ゼロ）。
 *
 * ★サーバー（app/(app)/page.tsx）が HTML を描く時点でログイン済みの殻を出すために使う。
 *   Clerk JS の起動を待たずに最初の絵が出る＝旧 Expo 版でベール解除まで約5.7秒かかった
 *   「JS 実行待ち」を、サーバー描画に置き換える狙い（docs/symptoms.md SG-09）。
 *
 * ★ルール（旧 lib/clerk-public-routes.ts の hasLiveClerkUatCookie と同じ）:
 *   値は Unix 秒。'0' はゲスト、'0' 以外はログイン済み。`__client_uat_<suffix>` が
 *   `__client_uat` と併置されることがあるので、**どれか1つでも '0' 以外ならログイン済み**とする
 *   （先頭の '0' だけを見てゲスト誤判定した 2026-09-29 の実損の再発防止）。
 *
 * ★これは「ヒント」であって認証ではない。本当の判定は Clerk（クライアント）が行い、
 *   食い違ったらゲスト表示に直す（components/LoggedInTopShell.tsx）。API の認可には使わない。
 */
export function hasSignedInUatCookie(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): boolean {
  return cookies.some(
    (c) => /^__client_uat(_.*)?$/.test(c.name) && c.value !== "" && c.value !== "0",
  );
}
